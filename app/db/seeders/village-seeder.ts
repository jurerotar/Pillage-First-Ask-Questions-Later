import type { Seeder } from 'app/interfaces/db';
import type { TileModel } from 'app/interfaces/models/game/tile';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { PLAYER_ID } from 'app/constants/player';
import { prngMulberry32 } from 'ts-seedrandom';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from 'app/utils/common';
import { getVillageSize } from 'app/db/utils/village-size';
import type { Player } from 'app/interfaces/models/game/player';
import { batchInsert } from 'app/db/utils/batch-insert';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from 'app/assets/village';

type OccupiableField = Pick<TileModel, 'id' | 'x' | 'y'>;

const villageSizeToVillageGroupRadiusMap = new Map<VillageSize, number>([
  ['xxs', 0],
  ['xs', 0],
  ['sm', 0],
  ['md', 3],
  ['lg', 4],
  ['xl', 5],
  ['2xl', 6],
  ['3xl', 7],
  ['4xl', 8],
]);

const villageSizeToAmountOfSupportingVillagesMap = new Map<VillageSize, number>(
  [
    ['xxs', 0],
    ['xs', 0],
    ['sm', 0],
    ['md', 1],
    ['lg', 2],
    ['xl', 4],
    ['2xl', 7],
    ['3xl', 10],
    ['4xl', 15],
  ],
);

export const villageSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  // Player village
  const playerStartingTileId = database.selectValue(
    'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
  )!;

  database.exec({
    sql: `
      INSERT INTO villages (name, slug, tile_id, player_id)
      VALUES ($name, $slug, $tile_id, $player_id);
    `,
    bind: {
      $name: 'New village',
      $slug: 'v-1',
      $tile_id: playerStartingTileId,
      $player_id: PLAYER_ID,
    },
  });

  // NPC villages
  const players = database.selectValues(
    `
      SELECT id
      FROM players
      WHERE id != $player_id
    `,
    { $player_id: PLAYER_ID },
  ) as Player['id'][];

  // Field [0, 0] is already occupied by the player
  const occupiableFields = database.selectObjects(
    `
      SELECT t.id, t.x, t.y
      FROM tiles AS t
             JOIN resource_field_compositions AS rfc
                  ON t.resource_field_composition_id = rfc.id
      WHERE t.type = $type
        AND rfc.resource_field_composition = $composition
        AND t.x != 0
        AND t.y != 0;
    `,
    { $type: 'free', $composition: '4446' },
  ) as OccupiableField[];

  const occupiableFieldMap = new Map<
    `${TileModel['x']}-${TileModel['y']}`,
    OccupiableField
  >(
    occupiableFields.map((occupiableField) => [
      `${occupiableField.x}-${occupiableField.y}`,
      occupiableField,
    ]),
  );

  const playerToOccupiedFields: [Player['id'], OccupiableField][] = [];

  const getNthMapValue = (
    map: Map<`${TileModel['x']}-${TileModel['y']}`, OccupiableField>,
    n: number,
  ): OccupiableField => {
    let i = 0;
    for (const value of map.values()) {
      if (i === n) {
        return value;
      }
      i++;
    }
    throw new Error('Index out of range');
  };

  for (const playerId of players) {
    // Select a random tile for the main village
    const startIndex = seededRandomIntFromInterval(
      prng,
      0,
      occupiableFieldMap.size - 1,
    );
    const startingTile = getNthMapValue(occupiableFieldMap, startIndex);

    playerToOccupiedFields.push([playerId, startingTile]);

    occupiableFieldMap.delete(`${startingTile.x}-${startingTile.y}`);

    const villageSize = getVillageSize(
      server.configuration.mapSize,
      startingTile.x,
      startingTile.y,
    );

    const radius = villageSizeToVillageGroupRadiusMap.get(villageSize) ?? 0;
    const extraVillageCount =
      villageSizeToAmountOfSupportingVillagesMap.get(villageSize) ?? 0;

    let assigned = 0;
    outer: for (let dx = -radius; dx <= radius; dx++) {
      if (assigned === extraVillageCount) {
        break;
      }

      for (let dy = -radius; dy <= radius; dy++) {
        if (assigned === extraVillageCount) {
          break outer;
        }

        if (dx === 0 && dy === 0) {
          continue;
        }

        const key: `${TileModel['x']}-${TileModel['y']}` = `${startingTile.x}-${startingTile.y}`;
        const candidateTile = occupiableFieldMap.get(key)!;
        if (!candidateTile) {
          continue;
        }

        playerToOccupiedFields.push([playerId, candidateTile]);

        occupiableFieldMap.delete(key);
        assigned += 1;

        if (assigned === extraVillageCount) {
          break outer;
        }
      }
    }
  }

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
