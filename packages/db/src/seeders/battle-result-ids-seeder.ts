import { battleResultIdSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const battleResultIdsSeeder = (database: DbFacade): void => {
  const battleResultIds = battleResultIdSchema.options;

  batchInsert(
    database,
    'battle_result_ids',
    ['battle_result'],
    battleResultIds.map((battleResult) => [battleResult]),
  );
};
