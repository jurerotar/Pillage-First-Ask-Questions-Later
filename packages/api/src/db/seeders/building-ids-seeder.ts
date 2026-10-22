import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const buildingIdsSeeder = (database: DbFacade): void => {
  const buildingIds = buildingIdSchema.options;

  batchInsert(
    database,
    'building_ids',
    ['building'],
    buildingIds.map((building) => [building]),
  );
};
