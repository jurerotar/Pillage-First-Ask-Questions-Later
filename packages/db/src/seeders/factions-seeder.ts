import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const factionsSeeder = (database: DbFacade): void => {
  const factionIds = database.selectObjects({
    sql: 'SELECT id, faction FROM faction_ids',
    schema: z.strictObject({
      id: z.number(),
      faction: z.string(),
    }),
  });

  const factions = factionIds.map((f) => [f.id]);

  batchInsert(database, 'factions', ['faction_id'], factions);
};
