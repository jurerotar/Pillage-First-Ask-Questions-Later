import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';

export const factionsSeeder: Seeder = (database): void => {
  const factions: [string, string][] = [
    ['player', 'Player'],
    ['npc1', 'NPC1'],
    ['npc2', 'NPC2'],
    ['npc3', 'NPC3'],
    ['npc4', 'NPC4'],
    ['npc5', 'NPC5'],
    ['npc6', 'NPC6'],
    ['npc7', 'NPC7'],
    ['npc8', 'NPC8'],
  ];

  batchInsert(database, 'factions', ['id', 'name'], factions);
};
