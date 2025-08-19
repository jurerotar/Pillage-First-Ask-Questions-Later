import type { Database } from 'app/interfaces/models/common';
import type { DbTile } from 'app/interfaces/models/db/tile';
import type { Server } from 'app/interfaces/models/game/server';
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

type OccupiableField = Pick<DbTile, 'id' | 'x' | 'y'>;

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

export const villageSeeder = (database: Database, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  // Player village
  const playerStartingTileId = database.selectValue(
    'SELECT id FROM tiles WHERE x = 0 AND y = 0;',
  )!;

  database.exec({
    sql: 'INSERT INTO villages (name, slug, tile_id, player_id) VALUES (?, ?, ?, ?);',
    bind: ['New village', 'v-1', playerStartingTileId, PLAYER_ID],
  });

  // NPC villages
  const players = database.selectValues(
    'SELECT id FROM players WHERE id != ?',
    [PLAYER_ID],
  ) as Player['id'][];
  const occupiableFields = database.selectObjects(
    'SELECT id, x, y FROM tiles WHERE type = ? AND resource_field_composition = ?;',
    ['free', '4446'],
  ) as OccupiableField[];

  const occupiableFieldMap = new Map<
    `${DbTile['x']}-${DbTile['y']}`,
    OccupiableField
  >(
    occupiableFields.map((occupiableField) => [
      `${occupiableField.x}-${occupiableField.y}`,
      occupiableField,
    ]),
  );

  const playerToOccupiedFields: [Player['id'], OccupiableField][] = [];

  const getNthMapValue = (
    map: Map<`${DbTile['x']}-${DbTile['y']}`, OccupiableField>,
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

        const key: `${DbTile['x']}-${DbTile['y']}` = `${startingTile.x}-${startingTile.y}`;
        if (!occupiableFieldMap.has(key)) {
          continue;
        }

        const candidateTile = occupiableFieldMap.get(key)!;
        playerToOccupiedFields.push([playerId, candidateTile]);

        occupiableFieldMap.delete(key);
        assigned += 1;

        if (assigned === extraVillageCount) {
          break outer;
        }
      }
    }
  }

  batchInsert(
    database,
    'villages',
    ['name', 'slug', 'tile_id', 'player_id'],
    playerToOccupiedFields,
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
};
