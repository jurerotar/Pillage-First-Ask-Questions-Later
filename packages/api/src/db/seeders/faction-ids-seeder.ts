import { factionSchema } from '@pillage-first/types/models/faction';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const factionIdsSeeder = (database: DbFacade): void => {
  const factionIds = factionSchema.options;

  batchInsert(
    database,
    'faction_ids',
    ['faction'],
    factionIds.map((faction) => [faction]),
  );
};
