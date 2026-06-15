import { z } from 'zod';
import { gameEventTypeSchema } from '../models/game-event';
import { tribeSchema } from '../models/tribe';

const villageTargetTroopMovementTypeSchema = gameEventTypeSchema.extract([
  'troopMovementReinforcements',
  'troopMovementRelocation',
  'troopMovementReturn',
  'troopMovementFindNewVillage',
  'troopMovementAttack',
  'troopMovementRaid',
  'troopMovementOasisOccupation',
]);

export const troopMovementItemDtoSchema = z
  .union([
    z.strictObject({
      id: z.number(),
      type: z.literal('troopMovementAdventure'),
      originatingVillageId: z.number(),
      originatingVillageName: z.string(),
      originatingTileId: z.number(),
      playerName: z.string(),
      playerId: z.number(),
      playerTribe: tribeSchema,
      resolvesAt: z.number(),
    }),
    z.strictObject({
      id: z.number(),
      type: villageTargetTroopMovementTypeSchema,
      originatingVillageId: z.number(),
      originatingVillageName: z.string(),
      originatingTileId: z.number(),
      playerName: z.string(),
      playerId: z.number(),
      playerTribe: tribeSchema,
      resolvesAt: z.number(),
      targetVillageId: z.number().nullable(),
      targetVillageName: z.string().nullable(),
      targetTileId: z.number().nullable(),
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
