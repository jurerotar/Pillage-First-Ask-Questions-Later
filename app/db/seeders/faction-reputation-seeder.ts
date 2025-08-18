import type { Database } from 'app/interfaces/models/common';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import { reputationLevels } from 'app/assets/reputation';

const sql = `
  INSERT INTO faction_reputation (source_faction, target_faction, reputation)
  VALUES (?, ?, ?);
`;

export const factionReputationSeeder = (database: Database): void => {
  const relations: [PlayerFaction, PlayerFaction, number][] = [
    ['player', 'npc1', reputationLevels.get('ecstatic')!],
    ['player', 'npc2', reputationLevels.get('honored')!],
    ['player', 'npc3', reputationLevels.get('respected')!],
    ['player', 'npc4', reputationLevels.get('friendly')!],
    ['player', 'npc5', reputationLevels.get('neutral')!],
    ['player', 'npc6', reputationLevels.get('unfriendly')!],
    ['player', 'npc7', reputationLevels.get('hostile')!],
    ['player', 'npc8', reputationLevels.get('hated')!],
  ];

  const stmt = database.prepare(sql);

  for (const [source, target, reputation] of relations) {
    stmt.bind([source, target, reputation]).stepReset();
  }

  stmt.finalize();
};
