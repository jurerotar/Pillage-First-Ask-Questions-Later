import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { gameEventTypeSchema } from '../models/game-event';
import { tribeSchema } from '../models/tribe';
import { troopSchema } from '../models/troop';

const villageTargetTroopMovementTypeSchema = gameEventTypeSchema.extract([
  'troopMovementReinforcements',
  'troopMovementRelocation',
  'troopMovementReturn',
  'troopMovementFindNewVillage',
  'troopMovementAttack',
  'troopMovementRaid',
  'troopMovementOasisOccupation',
]);

export const tileTroopMovementDtoSchema = z.strictObject({
  id: z.number(),
  type: villageTargetTroopMovementTypeSchema,
  originName: z.string().nullable(),
  originCoordinates: coordinatesSchema,
  targetTileId: z.number(),
  targetName: z.string().nullable(),
  targetCoordinates: coordinatesSchema,
  resolvesAt: z.number(),
});

export const troopMovementItemDtoSchema = z
  .union([
    z.strictObject({
      id: z.number(),
      type: z.literal('troopMovementAdventure'),
      originatingVillageId: z.number().nullable(),
      originatingVillageName: z.string().nullable(),
      originatingTileId: z.number(),
      playerName: z.string(),
      playerId: z.number(),
      playerTribe: tribeSchema,
      resolvesAt: z.number(),
      troops: z.array(troopSchema).nullable(),
    }),
    z.strictObject({
      id: z.number(),
      type: villageTargetTroopMovementTypeSchema,
      originatingVillageId: z.number().nullable(),
      originatingVillageName: z.string().nullable(),
      originatingTileId: z.number(),
      playerName: z.string(),
      playerId: z.number(),
      playerTribe: tribeSchema,
      resolvesAt: z.number(),
      targetVillageId: z.number().nullable(),
      targetVillageName: z.string().nullable(),
      targetTileId: z.number().nullable(),
      troops: z.array(troopSchema).nullable(),
    }),
  ])
  .meta({ id: 'TroopMovementItemDto' });

export type TroopMovementItemDto = z.infer<typeof troopMovementItemDtoSchema>;

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

export type TroopMovementStatsItemDto = z.infer<
  typeof troopMovementStatsItemDtoSchema
>;
