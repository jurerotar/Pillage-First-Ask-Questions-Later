import { reportOutcomeSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const reportOutcomeIdsSeeder = (database: DbFacade): void => {
  const reportOutcomeIds = reportOutcomeSchema.options;

  batchInsert(
    database,
    'report_outcome_ids',
    ['report_outcome'],
    reportOutcomeIds.map((reportOutcome) => [reportOutcome]),
  );
};
