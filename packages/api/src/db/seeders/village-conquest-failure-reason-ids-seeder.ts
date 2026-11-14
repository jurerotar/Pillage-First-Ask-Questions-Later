import { villageConquestFailureReasonSchema } from '@pillage-first/types/models/battle';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const villageConquestFailureReasonIdsSeeder = (
  database: DbFacade,
): void => {
  batchInsert(
    database,
    'village_conquest_failure_reason_ids',
    ['id', 'reason'],
    villageConquestFailureReasonSchema.options.map((reason, index) => [
      index + 1,
      reason,
    ]),
  );
};
