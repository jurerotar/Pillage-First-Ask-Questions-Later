import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { PlayerFaction } from 'app/interfaces/models/game/player';

export const factionsSeeder: Seeder = (database): void => {
  const factions: PlayerFaction[][] = [
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

  batchInsert(database, 'factions', ['name'], factions, (row) => row);
};
