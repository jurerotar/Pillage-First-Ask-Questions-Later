import {
  futurePlayableTribeSchema,
  npcOnlyTribeSchema,
  playableTribeSchema,
} from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const tribeIdsSeeder = (database: DbFacade): void => {
  const tribes = [
    ...playableTribeSchema.options,
    ...futurePlayableTribeSchema.options,
    ...npcOnlyTribeSchema.options,
  ];

  batchInsert(
    database,
    'tribe_ids',
    ['tribe'],
    tribes.map((tribe) => [tribe]),
  );
};
