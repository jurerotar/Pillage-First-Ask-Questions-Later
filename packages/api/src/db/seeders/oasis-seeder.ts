import { z } from 'zod';
import {
  type Resource,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import type { GeneratedOasisBonus } from '../utils/oasis-bonus-generator';

export const oasisSeeder = (
  database: DbFacade,
  oasisBonuses: readonly GeneratedOasisBonus[],
): void => {
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

  batchInsert(
    database,
    'oasis',
    ['tile_id', 'resource_id', 'bonus', 'village_id'],
    oasisBonuses.map(({ tileId, resource, bonus }) => [
      tileId,
      resourceIds.get(resource)!,
      bonus,
      null,
    ]),
  );
};
