import { combatResultIdSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const combatResultIdsSeeder = (database: DbFacade): void => {
  const combatResultIds = combatResultIdSchema.options;

  batchInsert(
    database,
    'combat_result_ids',
    ['combat_result'],
    combatResultIds.map((combatResult) => [combatResult]),
  );
};
