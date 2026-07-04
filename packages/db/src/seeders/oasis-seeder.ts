import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import type { Resource } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';

export const oasisSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const resourceRows = database.selectObjects({
    sql: 'SELECT id, resource FROM resource_ids;',
    schema: z.strictObject({
      id: z.number(),
      resource: z.enum(['wood', 'clay', 'iron', 'wheat']),
    }),
  });
  const resourceIds = new Map<Resource, number>(
    resourceRows.map(({ id, resource }) => [resource, id]),
  );

  const oasisTiles = database.selectObjects({
    sql: `
      SELECT id, oasis_graphics
      FROM
        tiles
      WHERE
        type_id = (SELECT id FROM tile_type_ids WHERE type = 'oasis');
    `,
    schema: z.strictObject({
      id: z.number(),
      oasis_graphics: z.number(),
    }),
  });

  const oasisBonuses: [number, number, number, null][] = [];

  for (const { id, oasis_graphics } of oasisTiles) {
    const { oasisResource } = decodeGraphicsProperty(oasis_graphics);

    const shouldHaveDoubleBonus = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (shouldHaveDoubleBonus) {
      oasisBonuses.push([id, resourceIds.get(oasisResource)!, 50, null]);

      continue;
    }

    // If oasis does not have 50% bonus, push 25% bonus instead.
    oasisBonuses.push([id, resourceIds.get(oasisResource)!, 25, null]);

    // If oasis is wheat, it can't have any other resource bonus
    if (oasisResource === 'wheat') {
      continue;
    }

    const shouldHaveCompositeBonus =
      seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!shouldHaveCompositeBonus) {
      continue;
    }

    oasisBonuses.push([id, resourceIds.get('wheat')!, 25, null]);
  }

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource_id', 'bonus', 'village_id'],
    oasisBonuses,
  );
};
