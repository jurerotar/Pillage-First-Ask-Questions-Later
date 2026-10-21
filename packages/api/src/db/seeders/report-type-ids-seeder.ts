import { reportTypeSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const reportTypeIdsSeeder = (database: DbFacade): void => {
  batchInsert(
    database,
    'report_type_ids',
    ['report_type'],
    reportTypeSchema.options.map((reportType) => [reportType]),
  );
};
