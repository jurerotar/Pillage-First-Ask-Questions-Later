import type { Seeder } from 'app/interfaces/db';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import { reputationLevels } from 'app/assets/reputation';
import { batchInsert } from 'app/db/utils/batch-insert';

export const factionReputationSeeder: Seeder = (database): void => {
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

  batchInsert(
    database,
    'faction_reputation',
    ['source_faction', 'target_faction', 'reputation'],
    relations,
    (row) => row,
  );
};
