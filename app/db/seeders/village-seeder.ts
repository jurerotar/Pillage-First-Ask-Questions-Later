import type { Seeder } from 'app/interfaces/db';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { PLAYER_ID } from 'app/constants/player';
import { prngMulberry32 } from 'ts-seedrandom';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from 'app/utils/common';
import { getVillageSize } from 'app/db/utils/village-size';
import { batchInsert } from 'app/db/utils/batch-insert';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from 'app/assets/village';

type OccupiableField = {
  id: number;
  x: number;
  y: number;
};

/**
 * Base radii that are deliberately smaller than your original values.
 * We'll scale these a bit with mapSize to keep them sensible on 100/200/300 maps.
 */
const baseVillageRadius: Record<VillageSize, number> = {
  xxs: 0,
  xs: 1,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5,
  '3xl': 6,
  '4xl': 7,
};

/** supporting villages (unchanged but you can tune) */
const villageSizeToAmountOfSupportingVillagesMap = new Map<VillageSize, number>(
  [
    ['xxs', 0],
    ['xs', 0],
    ['sm', 1],
    ['md', 2],
    ['lg', 4],
    ['xl', 7],
    ['2xl', 9],
    ['3xl', 10],
    ['4xl', 13],
  ],
);

/** seeded Fisher–Yates shuffle in-place; prng() returns float in [0,1) */
const seededShuffle = <T>(arr: T[], prng: () => number) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};

export const villageSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const usableRadius = server.configuration.mapSize / 2;

  // bias exponent: >1 favors center more strongly; 1 is linear, 2 quadratic, 3 cubic
  const CENTER_BIAS_EXPONENT = 1;

  // helper: normalized distance 0..1 for tile
  const normalizedDistanceForTile = (tile: OccupiableField) => {
    const dist = Math.hypot(tile.x, tile.y);
    return Math.min(1, dist / usableRadius);
  };

  const pickWeightedAndRemove = (): OccupiableField | undefined => {
    if (occupiableFieldsArr.length === 0) {
      return undefined;
    }

    // build weights array (cheap enough; occupiableFieldsArr shrinks each pick)
    let total = 0;
    const weights: number[] = new Array(occupiableFieldsArr.length);
    for (let i = 0; i < occupiableFieldsArr.length; i += 1) {
      const t = occupiableFieldsArr[i];
      const norm = normalizedDistanceForTile(t); // 0..1
      // weight: prefer center (1 - norm), raise to exponent to control strength
      const w = (1 - norm) ** CENTER_BIAS_EXPONENT;
      weights[i] = w;
      total += w;
    }

    // if all weights are zero (unlikely), fallback to uniform
    if (total <= 0) {
      const idx = seededRandomIntFromInterval(
        prng,
        0,
        occupiableFieldsArr.length - 1,
      );
      const [item] = occupiableFieldsArr.splice(idx, 1);
      occupiableFieldMap.delete(`${item.x}-${item.y}`);
      return item;
    }

    // pick random threshold
    const r = prng() * total;
    // find index by cumulative sum
    let acc = 0;
    let chosenIndex = 0;
    for (let i = 0; i < weights.length; i += 1) {
      acc += weights[i];
      if (r <= acc) {
        chosenIndex = i;
        break;
      }
    }

    const [item] = occupiableFieldsArr.splice(chosenIndex, 1);
    occupiableFieldMap.delete(`${item.x}-${item.y}`);

    return item;
  };

  // Player village (fixed)
  const playerStartingTileId = database.selectValue(
    'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
  )!;

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

  // NPC players
  const playerIds = database.selectValues(
    `
      SELECT id
      FROM
        players
      WHERE
        id != $player_id
    `,
    { $player_id: PLAYER_ID },
  ) as number[];

  // All occupiable fields (exclude only the player center)
  const occupiableFields = database.selectObjects(
    `
      SELECT t.id, t.x, t.y
      FROM
        tiles AS t
      WHERE
        t.type = 'free'
        AND NOT (t.x = 0 AND t.y = 0);
    `,
    {},
  ) as OccupiableField[];

  // Shuffle the global pool once (seeded) and build a coord->tile map
  const occupiableFieldsArr = occupiableFields.slice();
  seededShuffle(occupiableFieldsArr, prng);
  const occupiableFieldMap = new Map<`${number}-${number}`, OccupiableField>(
    occupiableFieldsArr.map((f) => [`${f.x}-${f.y}`, f]),
  );

  const playerToOccupiedFields: [number, OccupiableField][] = [];

  // helper: remove specific tile (coord) from array+map
  const removeByCoords = (x: number, y: number) => {
    const key = `${x}-${y}` as const;
    if (!occupiableFieldMap.has(key)) {
      return false;
    }
    occupiableFieldMap.delete(key);
    const idx = occupiableFieldsArr.findIndex((f) => f.x === x && f.y === y);
    if (idx >= 0) {
      occupiableFieldsArr.splice(idx, 1);
    }
    return true;
  };

  // small helper to compute a scaled radius using mapSize to avoid enormous radii on small maps
  const computeScaledRadius = (base: number, mapSize: number) => {
    // scale factor: maps {100 -> 1, 200 -> 1, 300 -> 2}
    const scale = Math.max(1, Math.round(mapSize / 200));
    return Math.max(0, Math.round(base * scale));
  };

  // We'll allocate fairly: compute a "fair cap" per player so early players don't take everything
  for (let pIndex = 0; pIndex < playerIds.length; pIndex += 1) {
    const playerId = playerIds[pIndex];

    if (occupiableFieldsArr.length === 0) {
      break;
    }

    const remainingPlayers = Math.max(1, playerIds.length - pIndex);
    const remainingTiles = occupiableFieldsArr.length;
    const fairCap = Math.max(1, Math.floor(remainingTiles / remainingPlayers));

    // choose how many villages this player gets (1..fairCap)
    const totalVillages = seededRandomIntFromInterval(prng, 1, fairCap);

    // pick main village
    const startingTile = pickWeightedAndRemove();

    if (!startingTile) {
      break;
    }

    playerToOccupiedFields.push([playerId, startingTile]);

    // compute village size & scaled radius
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

    // how many extra villages to try to assign (cap to available tiles and configured max)
    const maxConfigured =
      villageSizeToAmountOfSupportingVillagesMap.get(villageSize) ?? 0;
    // random 0..maxConfigured (you can bias to lower values if desired)
    const desiredExtra =
      maxConfigured > 0
        ? seededRandomIntFromInterval(prng, 0, maxConfigured)
        : 0;
    // final extra = min(desiredExtra, totalVillages-1, remainingTiles)
    let need = Math.min(
      desiredExtra,
      Math.max(0, totalVillages - 1),
      occupiableFieldsArr.length,
    );

    // Try neighbours: create offsets then shuffle them to avoid axis bias
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
      seededShuffle(offsets, prng);

      for (const [dx, dy] of offsets) {
        if (need === 0) {
          break;
        }
        const nx = startingTile.x + dx;
        const ny = startingTile.y + dy;
        const key = `${nx}-${ny}` as const;
        if (!occupiableFieldMap.has(key)) {
          continue;
        }

        // claim it
        const tile = occupiableFieldMap.get(key)!;
        removeByCoords(tile.x, tile.y);
        playerToOccupiedFields.push([playerId, tile]);
        need -= 1;
      }
    }

    // If still need more, take random tiles from global pool BUT prefer to avoid extremely local picks:
    // prefer tiles whose distance from startingTile is > minDistance (so cluster doesn't hog entire region)
    const minDistanceForFallback = Math.max(3, radius + 1); // tuneable
    while (need > 0 && occupiableFieldsArr.length > 0) {
      // find a candidate that satisfies minDistance (try up to some attempts)
      let candidateIndex = -1;
      const attempts = Math.min(5, occupiableFieldsArr.length);
      for (let a = 0; a < attempts; a += 1) {
        const idx = seededRandomIntFromInterval(
          prng,
          0,
          occupiableFieldsArr.length - 1,
        );
        const c = occupiableFieldsArr[idx];
        const dx = c.x - startingTile.x;
        const dy = c.y - startingTile.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minDistanceForFallback * minDistanceForFallback) {
          candidateIndex = idx;
          break;
        }
        // otherwise keep candidateIndex = -1 and try again
      }

      // fallback: if we couldn't find a remote candidate in a few tries, just pick random
      if (candidateIndex === -1) {
        candidateIndex = seededRandomIntFromInterval(
          prng,
          0,
          occupiableFieldsArr.length - 1,
        );
      }

      const [tile] = occupiableFieldsArr.splice(candidateIndex, 1);
      occupiableFieldMap.delete(`${tile.x}-${tile.y}`);
      playerToOccupiedFields.push([playerId, tile]);
      need -= 1;
    }
  }

  // convert to rows & insert
  const rows = playerToOccupiedFields.map(([playerId, { id: tileId }]) => {
    const adjective = seededRandomArrayElement(prng, npcVillageNameAdjectives);
    const noun = seededRandomArrayElement(prng, npcVillageNameNouns);
    const name = `${adjective}${noun}`;
    return [name, null, tileId, playerId];
  });

  batchInsert(
    database,
    'villages',
    ['name', 'slug', 'tile_id', 'player_id'],
    rows,
  );
};
