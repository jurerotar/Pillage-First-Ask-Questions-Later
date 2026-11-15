import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';

const villageSchema = z.strictObject({
  id: z.number(),
  x: z.number(),
  y: z.number(),
  hero_mansion_level: z.number(),
});

const oasisSchema = z.strictObject({
  id: z.number(),
  x: z.number(),
  y: z.number(),
});

const getOasisSlots = (heroMansionLevel: number): number => {
  if (heroMansionLevel >= 20) {
    return 3;
  }

  if (heroMansionLevel >= 15) {
    return 2;
  }

  if (heroMansionLevel >= 10) {
    return 1;
  }

  return 0;
};

export const occupiedOasisSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const prng = prngMulberry32(server.seed);

  const villageFields = database.selectObjects({
    sql: `
      SELECT
        villages.id,
        x,
        y,
        COALESCE(MAX(building_fields.level), 0) AS hero_mansion_level
      FROM
        tiles
          INNER JOIN villages ON tiles.id = villages.tile_id
          LEFT JOIN building_fields
            ON building_fields.village_id = villages.id
            AND building_fields.building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION')
      GROUP BY
        villages.id,
        x,
        y;
    `,
    schema: villageSchema,
  });

  const occupiableOasis = database.selectObjects({
    sql: `
      SELECT tiles.id, x, y
      FROM
        tiles
      WHERE
        type_id = (SELECT id FROM tile_type_ids WHERE type = 'oasis');
    `,
    schema: oasisSchema,
  });

  const occupiableOasisMap = new Map<
    `${number}-${number}`,
    z.infer<typeof oasisSchema>
  >(occupiableOasis.map((oasis) => [`${oasis.x}-${oasis.y}`, oasis]));

  const oasisByVillages: [number, number][] = [];

  for (const { hero_mansion_level, id: villageId, x, y } of villageFields) {
    const maxOasisAmount = getOasisSlots(hero_mansion_level);

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
    sql: 'UPDATE oasis SET village_id = $village_id WHERE tile_id = $tile_id;',
  });

  for (const resultSet of oasisByVillages) {
    const [villageId, tileId] = resultSet;
    stmt.bind({ $village_id: villageId, $tile_id: tileId }).stepReset();
  }
};
