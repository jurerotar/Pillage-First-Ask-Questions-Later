import { resourceSchema } from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const resourceIdsSeeder = (database: DbFacade): void => {
  batchInsert(
    database,
    'resource_ids',
    ['resource'],
    resourceSchema.options.map((resource) => [resource]),
  );
};
