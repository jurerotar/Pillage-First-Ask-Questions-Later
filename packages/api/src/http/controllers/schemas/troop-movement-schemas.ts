import { z } from 'zod';
import { tileTroopMovementDtoSchema } from '@pillage-first/types/dtos/troop-movement';
import { jsonCoordinatesSchema } from '@pillage-first/types/models/coordinates';
import { troopMovementTypeSchema } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getTileTroopMovementsRowSchema = tileTroopMovementDtoSchema.extend(
  {
    originCoordinates: jsonCoordinatesSchema,
    targetCoordinates: jsonCoordinatesSchema,
  },
);

export const troopMovementValidationBodySchema = z.strictObject({
  type: troopMovementTypeSchema,
  originTileId: tileIdSchema,
  targetTileId: tileIdSchema,
  troops: z.array(
    z.strictObject({
      unitId: unitIdSchema,
      amount: z.int().positive(),
    }),
  ),
});

export const getVillageTroopMovementsRowSchema = z
  .strictObject({
    id: z.int().positive(),
    type: troopMovementTypeSchema,
    starts_at: z.number(),
    duration: z.number(),
    resolves_at: z.number(),
    meta: z.string(),
    originating_village_id: z.int().positive().nullable(),
    originating_village_name: z.string().nullable(),
    originating_tile_id: tileIdSchema,
    player_id: z.int().positive(),
    player_name: z.string(),
    player_tribe: tribeSchema,
    target_village_id: z.int().positive().nullable(),
    target_village_name: z.string().nullable(),
    target_tile_id: tileIdSchema,
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
    count: z.int().positive(),
    earliest_resolves_at: z.number(),
  })
  .meta({ id: 'GetVillageTroopMovementStatsRow' });
