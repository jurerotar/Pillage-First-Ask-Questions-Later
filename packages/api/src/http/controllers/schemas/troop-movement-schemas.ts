import { z } from 'zod';
import { gameEventTypeSchema } from '@pillage-first/types/models/game-event';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const troopMovementValidationBodySchema = z.strictObject({
  type: gameEventTypeSchema,
  villageId: z.number(),
  targetTileId: z.number().int().min(1),
  troops: z.array(
    z.strictObject({
      unitId: unitIdSchema,
      amount: z.number(),
    }),
  ),
});

export const getVillageTroopMovementsRowSchema = z
  .strictObject({
    id: z.number(),
    type: z.string(),
    starts_at: z.number(),
    duration: z.number(),
    resolves_at: z.number(),
    meta: z.string(),
    originating_village_id: z.number(),
    originating_village_name: z.string(),
    originating_tile_id: z.number(),
    player_id: z.number(),
    player_name: z.string(),
    player_tribe: tribeSchema,
    target_village_id: z.number().nullable(),
    target_village_name: z.string().nullable(),
    target_tile_id: z.number().nullable(),
  })
  .meta({ id: 'GetVillageTroopMovementsRow' });

export const getVillageTroopMovementStatsRowSchema = z
  .strictObject({
    movement_type: z.enum([
      'deploymentOutgoing',
      'deploymentIncoming',
      'offensiveMovementOutgoing',
      'offensiveMovementIncoming',
      'adventure',
      'findNewVillage',
    ]),
    count: z.number(),
    earliest_resolves_at: z.number(),
  })
  .meta({ id: 'GetVillageTroopMovementStatsRow' });
