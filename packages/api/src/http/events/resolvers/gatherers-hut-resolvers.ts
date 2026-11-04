import { z } from 'zod';
import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { assessGatheredResourceCountQuestCompletion } from '../../../utils/quests';
import { insertGatheringExpeditionReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { addResourceSiteResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

export const gatherersHutGatheringTripResolver: Resolver<
  GameEvent<'gatherersHutGatheringTrip'>
> = (database, args) => {
  const { resolvesAt, troops, villageId } = args;

  let sentTroopAmount = 0;

  for (const troop of troops) {
    sentTroopAmount += troop.amount;
  }

  const loot = calculateGatherersHutGatheringResources(sentTroopAmount);

  addTroops(database, troops);

  const village = database.selectObject({
    sql: `
      SELECT v.tile_id, v.player_id, p.tribe_id
      FROM villages v JOIN players p ON p.id = v.player_id
      WHERE v.id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      tile_id: tileIdSchema,
      player_id: z.number(),
      tribe_id: z.int(),
    }),
  })!;

  addResourceSiteResourcesAt(database, village.tile_id, resolvesAt, loot);

  insertGatheringExpeditionReport(database, {
    villageId,
    timestamp: resolvesAt,
    villageTileId: village.tile_id,
    tribeId: village.tribe_id,
    loot,
    units: troops,
  });

  assessGatheredResourceCountQuestCompletion(
    database,
    resolvesAt,
    village.player_id,
  );

  database.exec({
    sql: `
      INSERT INTO gatherers_hut_expeditions (village_id, completed)
      VALUES ($village_id, 1)
      ON CONFLICT(village_id) DO UPDATE SET
        completed = completed + 1;
    `,
    bind: {
      $village_id: villageId,
    },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [village.tile_id],
  };
};
