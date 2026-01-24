import { reputationLevels } from '@pillage-first/game-assets/reputation';
import { factionSchema } from '@pillage-first/types/models/faction';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { z } from 'zod';

export const factionReputationSeeder: Seeder = (database): void => {
  const rows = database.selectObjects({
    sql: 'SELECT faction, id FROM factions;',
    schema: z.strictObject({
      faction: factionSchema,
      id: z.number(),
    }),
  });

  const factionToIdMap = Object.fromEntries(
    rows.map((r) => [r.faction, r.id] as const),
  );

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
