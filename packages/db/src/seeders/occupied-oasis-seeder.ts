import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import type { Server } from '@pillage-first/types/models/server';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { getVillageSize } from '../utils/village-size';

const villageSizeToMaxOasisAmountMap = new Map<VillageSize, number>([
  ['xxs', 0],
  ['xs', 0],
  ['sm', 0],
  ['md', 1],
  ['lg', 1],
  ['xl', 2],
  ['2xl', 2],
  ['3xl', 3],
  ['4xl', 3],
]);

const schema = z.strictObject({
  id: z.number(),
  x: z.number(),
  y: z.number(),
});

export const occupiedOasisSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const prng = prngMulberry32(server.seed);

  const villageFields = database.selectObjects({
    sql: 'SELECT villages.id, x, y FROM tiles INNER JOIN villages ON tiles.id = villages.tile_id;',
    schema,
  });

  const occupiableOasis = database.selectObjects({
    sql: 'SELECT oasis.id, x, y FROM tiles INNER JOIN oasis ON tiles.id = oasis.tile_id;',
    schema,
  });

  const occupiableOasisMap = new Map<
    `${number}-${number}`,
    z.infer<typeof schema>
  >(occupiableOasis.map((oasis) => [`${oasis.x}-${oasis.y}`, oasis]));

  const oasisByVillages: [number, number][] = [];

  for (const { id: villageId, x, y } of villageFields) {
    const villageSize = getVillageSize(server.configuration.mapSize, x, y);
    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;

    if (maxOasisAmount === 0) {
      continue;
    }

    let assignedOasisCounter = 0;

    outer: for (let dx = -3; dx <= 3; dx += 1) {
      for (let dy = -3; dy <= 3; dy += 1) {
        const key: `${number}-${number}` = `${x + dx}-${y + dy}`;

        const candidateTile = occupiableOasisMap.get(key);
        if (!candidateTile) {
          continue;
        }

        const willOasisBeAssigned =
          seededRandomIntFromInterval(prng, 1, 3) === 1;

        if (!willOasisBeAssigned) {
          continue;
        }

        oasisByVillages.push([villageId, candidateTile.id]);
        assignedOasisCounter += 1;

        // Delete key to make sure other villages can't overwrite it
        occupiableOasisMap.delete(key);

        if (assignedOasisCounter === maxOasisAmount) {
          break outer;
        }
      }
    }
  }

  const stmt = database.prepare({
    sql: 'UPDATE oasis SET village_id = $village_id WHERE id = $oasis_id;',
  });

  for (const resultSet of oasisByVillages) {
    const [villageId, oasisId] = resultSet;
    stmt.bind({ $village_id: villageId, $oasis_id: oasisId }).stepReset();
  }

  stmt.finalize();
};
