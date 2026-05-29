import { z } from 'zod';
import { tribeSchema } from '@pillage-first/types/models/tribe';

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
    originating_village_x: z.number(),
    originating_village_y: z.number(),
    player_id: z.number(),
    player_name: z.string(),
    player_tribe: tribeSchema,
    target_village_id: z.number().nullable(),
    target_village_name: z.string().nullable(),
    target_village_x: z.number().nullable(),
    target_village_y: z.number().nullable(),
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
