import type { Database } from 'app/interfaces/models/common';
import type { PlayerFaction } from 'app/interfaces/models/game/player';

const sql = `
  INSERT INTO faction_reputation (source_faction, target_faction, reputation)
  VALUES (?, ?, ?);
`;

export const factionReputationSeeder = (database: Database): void => {
  const relations: [PlayerFaction, PlayerFaction, number][] = [
    ['player', 'npc1', 0],
    ['npc1', 'player', 0],

    ['player', 'npc2', 0],
    ['npc2', 'player', 0],

    ['player', 'npc3', 0],
    ['npc3', 'player', 0],

    ['player', 'npc4', 0],
    ['npc4', 'player', 0],

    ['player', 'npc5', 0],
    ['npc5', 'player', 0],

    ['player', 'npc6', 0],
    ['npc6', 'player', 0],

    ['player', 'npc7', 0],
    ['npc7', 'player', 0],

    ['player', 'npc8', 0],
    ['npc8', 'player', 0],
  ];

  const stmt = database.prepare(sql);

  for (const [source, target, reputation] of relations) {
    stmt.bind([source, target, reputation]).stepReset();
  }

  stmt.finalize();
};
