import type { Database } from 'app/interfaces/models/common';

const sql = 'INSERT INTO factions (id, name) VALUES (?, ?);';

export const factionsSeeder = (database: Database): void => {
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

  const stmt = database.prepare(sql);

  for (const [id, name] of factions) {
    stmt.bind([id, name]).stepReset();
  }

  stmt.finalize();
};
