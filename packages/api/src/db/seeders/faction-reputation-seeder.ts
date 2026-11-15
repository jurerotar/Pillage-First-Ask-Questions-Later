import { z } from 'zod';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import { factionSchema } from '@pillage-first/types/models/faction';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const factionReputationSeeder = (
  database: DbFacade,
  playerId: number,
): void => {
  const rows = database.selectObjects({
    sql: 'SELECT faction, id FROM faction_ids;',
    schema: z.strictObject({
      faction: factionSchema,
      id: z.number(),
    }),
  });

  const factionToIdMap = Object.fromEntries(
    rows.map((r) => [r.faction, r.id] as const),
  );

  const relations: [number, number, number][] = [
    [playerId, factionToIdMap.npc1, reputationLevels.get('ecstatic')!],
    [playerId, factionToIdMap.npc2, reputationLevels.get('honored')!],
    [playerId, factionToIdMap.npc3, reputationLevels.get('respected')!],
    [playerId, factionToIdMap.npc4, reputationLevels.get('friendly')!],
    [playerId, factionToIdMap.npc5, reputationLevels.get('neutral')!],
    [playerId, factionToIdMap.npc6, reputationLevels.get('unfriendly')!],
    [playerId, factionToIdMap.npc7, reputationLevels.get('hostile')!],
    [playerId, factionToIdMap.npc8, reputationLevels.get('hated')!],
  ];

  batchInsert(
    database,
    'faction_reputation',
    ['player_id', 'target_faction_id', 'reputation'],
    relations,
  );
};
