import { oasisCaptureFailureReasonSchema } from '@pillage-first/types/models/battle';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const oasisCaptureFailureReasonIdsSeeder = (
  database: DbFacade,
): void => {
  batchInsert(
    database,
    'oasis_capture_failure_reason_ids',
    ['id', 'reason'],
    oasisCaptureFailureReasonSchema.options.map((reason, index) => [
      index + 1,
      reason,
    ]),
  );
};
