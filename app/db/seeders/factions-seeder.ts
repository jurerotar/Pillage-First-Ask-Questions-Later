import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { Faction } from 'app/interfaces/models/game/faction';

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
