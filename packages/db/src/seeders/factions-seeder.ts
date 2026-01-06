import type { Faction } from '@pillage-first/types/models/faction';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';

export const factionsSeeder: Seeder = (database): void => {
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
