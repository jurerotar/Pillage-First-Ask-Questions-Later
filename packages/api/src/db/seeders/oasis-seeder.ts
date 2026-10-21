import { z } from 'zod';
import {
  type Resource,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { generateOasisBonusesForTiles } from '../utils/oasis-bonus-generator';

export const oasisSeeder = (database: DbFacade, server: Server): void => {
  const resourceRows = database.selectObjects({
    sql: 'SELECT id, resource FROM resource_ids;',
    schema: z.strictObject({
      id: z.number(),
      resource: resourceSchema,
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
        type_id = (SELECT id FROM tile_type_ids WHERE type = 'oasis')
      ORDER BY
        id;
    `,
    schema: z.strictObject({
      id: z.number(),
      oasis_graphics: z.number(),
    }),
  });

  const oasisBonuses = generateOasisBonusesForTiles(server, oasisTiles).map(
    ({ tileId, resource, bonus }): [number, number, number, null] => [
      tileId,
      resourceIds.get(resource)!,
      bonus,
      null,
    ],
  );

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource_id', 'bonus', 'village_id'],
    oasisBonuses,
  );
};
