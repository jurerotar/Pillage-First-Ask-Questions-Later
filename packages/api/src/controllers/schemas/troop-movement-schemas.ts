import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getVillageTroopMovementsSchema = z
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
  .transform((t) => {
    const isAdventure = t.type === 'troopMovementAdventure';
    return {
      id: t.id,
      type: t.type,
      originatingVillageId: t.originating_village_id,
      originatingVillageName: t.originating_village_name,
      originatingVillageCoordinates: {
        x: t.originating_village_x,
        y: t.originating_village_y,
      },
      playerName: t.player_name,
      playerId: t.player_id,
      playerTribe: t.player_tribe,
      resolvesAt: t.resolves_at,
      ...(isAdventure
        ? {}
        : {
            targetVillageId: t.target_village_id,
            targetVillageName: t.target_village_name,
            targetVillageCoordinates:
              t.target_village_x !== null && t.target_village_y !== null
                ? { x: t.target_village_x, y: t.target_village_y }
                : null,
          }),
    };
  })
  .pipe(
    z.union([
      z.strictObject({
        id: z.number(),
        type: z.literal('troopMovementAdventure'),
        originatingVillageId: z.number(),
        originatingVillageName: z.string(),
        originatingVillageCoordinates: coordinatesSchema,
        playerName: z.string(),
        playerId: z.number(),
        playerTribe: tribeSchema,
        resolvesAt: z.number(),
      }),
      z.strictObject({
        id: z.number(),
        type: z.string(),
        originatingVillageId: z.number(),
        originatingVillageName: z.string(),
        originatingVillageCoordinates: coordinatesSchema,
        playerName: z.string(),
        playerId: z.number(),
        playerTribe: tribeSchema,
        resolvesAt: z.number(),
        targetVillageId: z.number().nullable(),
        targetVillageName: z.string().nullable(),
        targetVillageCoordinates: coordinatesSchema.nullable(),
      }),
    ]),
  );

export const getVillageTroopMovementStatsSchema = z
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
  .transform((t) => ({
    type: t.movement_type,
    count: t.count,
    earliestResolvesAt: t.earliest_resolves_at,
  }))
  .pipe(
    z.strictObject({
      type: z.enum([
        'deploymentOutgoing',
        'deploymentIncoming',
        'offensiveMovementOutgoing',
        'offensiveMovementIncoming',
        'adventure',
        'findNewVillage',
      ]),
      count: z.number(),
      earliestResolvesAt: z.number(),
    }),
  );
