import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const reportTagIdsSeeder = (database: DbFacade): void => {
  const reportTagIds = [
    'READ',
    'ARCHIVED',
    'ATTACKER_NO_LOSS',
    'ATTACKER_SOME_LOSS',
    'ATTACKER_FULL_LOSS',
    'DEFENDER_NO_LOSS',
    'DEFENDER_SOME_LOSS',
    'DEFENDER_FULL_LOSS',
  ];

  batchInsert(
    database,
    'report_tag_ids',
    ['tag'],
    reportTagIds.map((tag) => [tag]),
  );
};
