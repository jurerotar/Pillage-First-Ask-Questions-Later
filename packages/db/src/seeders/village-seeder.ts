import { type PRNGFunction, prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from '@pillage-first/game-assets/village';
import type { Server } from '@pillage-first/types/models/server';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FenwickTree } from '@pillage-first/utils/fenwick-tree';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

type OccupiableField = {
  id: number;
  x: number;
  y: number;
};

type VillageInsertRow = [
  name: string,
  slug: null,
  tileId: number,
  playerId: number,
];

const occupiableFieldSchema = z.strictObject({
  id: z.number(),
  x: z.number(),
  y: z.number(),
});

const baseVillageRadius = {
  xxs: 0,
  xs: 1,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5,
  '3xl': 6,
  '4xl': 7,
} as const satisfies Record<VillageSize, number>;

const supportingVillageCountBySize = {
  xxs: 0,
  xs: 0,
  sm: 1,
  md: 2,
  lg: 4,
  xl: 7,
  '2xl': 9,
  '3xl': 10,
  '4xl': 13,
} as const satisfies Record<VillageSize, number>;

const computeScaledRadius = (base: number, mapSize: number) => {
  const scale = Math.max(1, Math.round(mapSize / 200));
  return Math.max(0, Math.round(base * scale));
};

const coordKey = ({ x, y }: Pick<OccupiableField, 'x' | 'y'>): string => {
  return `${x}-${y}`;
};

const coordKeyFromCoordinates = (x: number, y: number): string => {
  return `${x}-${y}`;
};

const shuffleInPlace = (prng: PRNGFunction, values: unknown[]): void => {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
};

export const villageSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const usableRadius = server.configuration.mapSize / 2;
  const CENTER_BIAS_EXPONENT = 1;

  const normalizedDistanceForTile = (tile: OccupiableField) => {
    const dist = Math.hypot(tile.x, tile.y);
    return Math.min(1, dist / usableRadius);
  };

  // Player village (fixed)
  const playerStartingTileId = database.selectValue({
    sql: 'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      INSERT INTO
        villages (name, slug, tile_id, player_id)
      VALUES
        ($name, $slug, $tile_id, $player_id);
    `,
    bind: {
      $name: 'New village',
      $slug: 'v-1',
      $tile_id: playerStartingTileId,
      $player_id: PLAYER_ID,
    },
  });

  const playerIds = database.selectValues({
    sql: `
      SELECT id
      FROM
        players
      WHERE
        id != $player_id
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  });

  const occupiableFields = database.selectObjects({
    sql: `
      SELECT t.id, t.x, t.y
      FROM
        tiles AS t
      WHERE
        t.type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
        AND NOT (t.x = 0 AND t.y = 0);
    `,
    schema: occupiableFieldSchema,
  });

  // keep arrays static for indexing
  const n = occupiableFields.length;
  const fields = [...occupiableFields];

  // precompute weights (static per tile)
  const weights = new Float64Array(n);

  for (let i = 0; i < n; i += 1) {
    const t = fields[i];
    const norm = normalizedDistanceForTile(t);
    const w = (1 - norm) ** CENTER_BIAS_EXPONENT;
    weights[i] = w;
  }

  // Fenwick for weighted sampling
  const fenwick = new FenwickTree(weights);

  // active indices array (for uniform picks) and index->pos map for O(1) removal
  const activeIndices: number[] = Array.from({ length: n }, (_, i) => i);

  shuffleInPlace(prng, activeIndices);

  const indexToActivePos = new Int32Array(n).fill(-1);

  for (let pos = 0; pos < activeIndices.length; pos += 1) {
    indexToActivePos[activeIndices[pos]] = pos;
  }

  // coord -> index map
  const coordToIndex = new Map<string, number>();

  for (let i = 0; i < n; i += 1) {
    coordToIndex.set(coordKey(fields[i]), i);
  }

  const removeIndex = (index: number) => {
    // If already removed, ignore
    const pos = indexToActivePos[index];
    if (pos === -1) {
      return false;
    }

    // remove from activeIndices via swap-and-pop
    const lastPos = activeIndices.length - 1;
    const lastIndex = activeIndices[lastPos];

    // swap only if not same
    if (pos !== lastPos) {
      activeIndices[pos] = lastIndex;
      indexToActivePos[lastIndex] = pos;
    }
    activeIndices.pop();
    indexToActivePos[index] = -1;

    // set fenwick weight to zero (subtract current weight)
    const w = weights[index];
    if (w !== 0) {
      fenwick.add(index, -w);
      weights[index] = 0;
    }

    // remove coord map too
    coordToIndex.delete(coordKey(fields[index]));
    return true;
  };

  const pickRandomActiveIndexAndRemove = (): number | undefined => {
    if (activeIndices.length === 0) {
      return undefined;
    }
    const pos = seededRandomIntFromInterval(prng, 0, activeIndices.length - 1);
    const idx = activeIndices[pos];
    removeIndex(idx);
    return idx;
  };

  const pickWeightedAndRemove = (): OccupiableField | undefined => {
    if (activeIndices.length === 0) {
      return undefined;
    }

    const total = fenwick.total();
    if (!(total > 0)) {
      // fallback uniform
      const idx = pickRandomActiveIndexAndRemove();
      return typeof idx === 'number' ? fields[idx] : undefined;
    }

    const r = prng() * total;
    let idx = fenwick.findByPrefix(r);
    // Ensure idx is active; if not (edge cases), fallback to a small linear probe.
    // But most builds return an active index.
    // If idx is removed, try next active via indexToActivePos checks.
    if (indexToActivePos[idx] === -1) {
      // linear probe forward (very small)
      let probe = idx + 1;
      while (probe < n && indexToActivePos[probe] === -1) {
        probe += 1;
      }
      if (probe < n) {
        idx = probe;
      } else {
        probe = idx - 1;
        while (probe >= 0 && indexToActivePos[probe] === -1) {
          probe -= 1;
        }
        if (probe >= 0) {
          idx = probe;
        } else {
          // no active found (shouldn't happen because total > 0) -> uniform fallback
          const uni = pickRandomActiveIndexAndRemove();
          return uni === undefined ? undefined : fields[uni];
        }
      }
    }

    // Now remove chosen index
    removeIndex(idx);
    return fields[idx];
  };

  const playerToOccupiedFields: [number, OccupiableField][] = [];

  for (let pIndex = 0; pIndex < playerIds.length; pIndex += 1) {
    const playerId = playerIds[pIndex];

    if (activeIndices.length === 0) {
      break;
    }

    const remainingPlayers = Math.max(1, playerIds.length - pIndex);
    const remainingTiles = activeIndices.length;
    const fairCap = Math.max(1, Math.floor(remainingTiles / remainingPlayers));

    const totalVillages = seededRandomIntFromInterval(prng, 1, fairCap);

    // pick main village
    const startingTile = pickWeightedAndRemove();
    if (!startingTile) {
      break;
    }
    playerToOccupiedFields.push([playerId, startingTile]);

    const villageSize = getVillageSize(
      server.configuration.mapSize,
      startingTile.x,
      startingTile.y,
    );
    const baseRadius = baseVillageRadius[villageSize];
    const radius = computeScaledRadius(
      baseRadius,
      server.configuration.mapSize,
    );

    const maxConfigured = supportingVillageCountBySize[villageSize];
    const desiredExtra =
      maxConfigured > 0
        ? seededRandomIntFromInterval(prng, 0, maxConfigured)
        : 0;

    let need = Math.min(
      desiredExtra,
      Math.max(0, totalVillages - 1),
      activeIndices.length,
    );

    // neighbors: use coordToIndex + removeIndex for O(1) removal
    if (radius > 0 && need > 0) {
      const offsets: [number, number][] = [];
      for (let dx = -radius; dx <= radius; dx += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          offsets.push([dx, dy]);
        }
      }
      shuffleInPlace(prng, offsets);

      for (const [dx, dy] of offsets) {
        if (need === 0) {
          break;
        }
        const nx = startingTile.x + dx;
        const ny = startingTile.y + dy;
        const idx = coordToIndex.get(coordKeyFromCoordinates(nx, ny));
        if (idx === undefined) {
          continue;
        }
        // claim it
        removeIndex(idx);
        playerToOccupiedFields.push([playerId, fields[idx]]);
        need -= 1;
      }
    }

    const minDistanceForFallback = Math.max(3, radius + 1);
    while (need > 0 && activeIndices.length > 0) {
      // attempt to find a random distant candidate (up to attempts)
      let candidateIdx = -1;
      const attempts = Math.min(5, activeIndices.length);
      for (let a = 0; a < attempts; a += 1) {
        const pos = seededRandomIntFromInterval(
          prng,
          0,
          activeIndices.length - 1,
        );
        const idx = activeIndices[pos];
        const c = fields[idx];
        const dx = c.x - startingTile.x;
        const dy = c.y - startingTile.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minDistanceForFallback * minDistanceForFallback) {
          candidateIdx = idx;
          break;
        }
      }

      if (candidateIdx === -1) {
        // fallback to uniform random
        const idx = pickRandomActiveIndexAndRemove();
        if (idx === undefined) {
          break;
        }
        playerToOccupiedFields.push([playerId, fields[idx]]);
      } else {
        // claim candidate
        removeIndex(candidateIdx);
        playerToOccupiedFields.push([playerId, fields[candidateIdx]]);
      }
      need -= 1;
    }
  }

  // convert to rows & insert
  const rows: VillageInsertRow[] = playerToOccupiedFields.map(
    ([playerId, { id: tileId }]) => {
      const adjective = seededRandomArrayElement(
        prng,
        npcVillageNameAdjectives,
      );
      const noun = seededRandomArrayElement(prng, npcVillageNameNouns);
      const name = `${adjective}${noun}`;
      return [name, null, tileId, playerId];
    },
  );

  batchInsert(
    database,
    'villages',
    ['name', 'slug', 'tile_id', 'player_id'],
    rows,
  );
};
