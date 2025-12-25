import { reputationLevels } from 'app/assets/reputation';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Seeder } from 'app/interfaces/db';
import type { Faction } from 'app/interfaces/models/game/faction';

export const factionReputationSeeder: Seeder = (database): void => {
  const rows = database.selectArrays('SELECT faction, id FROM factions;') as [
    Faction,
    number,
  ][];

  const factionToIdMap = Object.fromEntries(rows);

  const playerFactionId = factionToIdMap.player;

  const relations: [number, number, number][] = [
    [playerFactionId, factionToIdMap.npc1, reputationLevels.get('ecstatic')!],
    [playerFactionId, factionToIdMap.npc2, reputationLevels.get('honored')!],
    [playerFactionId, factionToIdMap.npc3, reputationLevels.get('respected')!],
    [playerFactionId, factionToIdMap.npc4, reputationLevels.get('friendly')!],
    [playerFactionId, factionToIdMap.npc5, reputationLevels.get('neutral')!],
    [playerFactionId, factionToIdMap.npc6, reputationLevels.get('unfriendly')!],
    [playerFactionId, factionToIdMap.npc7, reputationLevels.get('hostile')!],
    [playerFactionId, factionToIdMap.npc8, reputationLevels.get('hated')!],
  ];

  batchInsert(
    database,
    'faction_reputation',
    ['source_faction_id', 'target_faction_id', 'reputation'],
    relations,
  );
};
