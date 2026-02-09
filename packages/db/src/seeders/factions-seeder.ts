import type { Faction } from '@pillage-first/types/models/faction';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const factionsSeeder = (database: DbFacade): void => {
  const factions: Faction[][] = [
    ['player'],
    ['npc1'],
    ['npc2'],
    ['npc3'],
    ['npc4'],
    ['npc5'],
    ['npc6'],
    ['npc7'],
    ['npc8'],
  ];

  batchInsert(database, 'factions', ['faction'], factions);
};
