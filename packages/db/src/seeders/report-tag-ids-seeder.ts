import { reportTagSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const reportTagIdsSeeder = (database: DbFacade): void => {
  const reportTagIds = reportTagSchema.options;

  batchInsert(
    database,
    'report_tag_ids',
    ['tag'],
    reportTagIds.map((tag) => [tag]),
  );
};
