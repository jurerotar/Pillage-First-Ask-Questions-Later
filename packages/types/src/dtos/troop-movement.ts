import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { tribeSchema } from '../models/tribe';

export const troopMovementItemDtoSchema = z
  .union([
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
  ])
  .meta({ id: 'TroopMovementItemDto' });

export const troopMovementStatsItemDtoSchema = z
  .strictObject({
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
  })
  .meta({ id: 'TroopMovementStatsItemDto' });
