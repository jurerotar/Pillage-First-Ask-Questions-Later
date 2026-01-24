import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import type { Resource } from '@pillage-first/types/models/resource';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';

export const oasisSeeder: Seeder = (database, server): void => {
  const prng = prngMulberry32(server.seed);

  const oasisTiles = database.selectObjects({
    sql: 'SELECT id, oasis_graphics FROM tiles WHERE type = $type;',
    bind: { $type: 'oasis' },
    schema: z.strictObject({
      id: z.number(),
      oasis_graphics: z.number(),
    }),
  });

  const oasisBonuses: [number, Resource, number, null][] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const shouldOasisHaveBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldOasisHaveBonus) {
      continue;
    }

    const { oasisResource } = decodeGraphicsProperty(oasis_graphics);

    const shouldHaveDoubleBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (shouldHaveDoubleBonus) {
      oasisBonuses.push([id, oasisResource, 50, null]);

      continue;
    }

    // If oasis does not have 50% bonus, push 25% bonus instead.
    oasisBonuses.push([id, oasisResource, 25, null]);

    // If oasis is wheat, it can't have any other resource bonus
    if (oasisResource === 'wheat') {
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldHaveCompositeBonus) {
      continue;
    }

    oasisBonuses.push([id, 'wheat', 25, null]);
  }

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource', 'bonus', 'village_id'],
    oasisBonuses,
  );
};
