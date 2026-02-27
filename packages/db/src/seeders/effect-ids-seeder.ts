import { effectIdSchema } from '@pillage-first/types/models/effect';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const effectIdsSeeder = (database: DbFacade): void => {
  const effectIds = [
    // !! wheatProduction must always remain at the top, because we use its id of 1 as a partial index in effects table !!
    'wheatProduction',
    ...effectIdSchema.options.filter((option) => option !== 'wheatProduction'),
  ];

  batchInsert(
    database,
    'effect_ids',
    ['effect'],
    effectIds.map((effect) => [effect]),
  );
};
