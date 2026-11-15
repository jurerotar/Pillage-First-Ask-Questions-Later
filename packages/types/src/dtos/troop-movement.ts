import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { coordinatesSchema } from '../models/coordinates';
import { troopMovementTypeSchema } from '../models/game-event';
import { resourceBundleSchema } from '../models/resource';
import { tribeSchema } from '../models/tribe';
import { troopSchema } from '../models/troop';

const villageTargetTroopMovementTypeSchema = troopMovementTypeSchema.exclude([
  'troopMovementAdventure',
]);

const lootSchema = resourceBundleSchema.refine(
  (amounts) => amounts.every((amount) => amount >= 0),
  'Loot amounts must be nonnegative',
);

export const tileTroopMovementDtoSchema = z.strictObject({
  id: z.int().positive(),
  type: villageTargetTroopMovementTypeSchema,
  originName: z.string().nullable(),
  originCoordinates: coordinatesSchema,
  targetTileId: tileIdSchema,
  targetName: z.string().nullable(),
  targetCoordinates: coordinatesSchema,
  resolvesAt: z.number(),
});

const movementShape = {
  id: z.int().positive(),
  originatingVillageId: z.int().positive().nullable(),
  originatingVillageName: z.string().nullable(),
  originatingTileId: tileIdSchema,
  playerName: z.string(),
  playerId: z.int().positive(),
  playerTribe: tribeSchema,
  startsAt: z.number(),
  resolvesAt: z.number(),
  troops: z.array(troopSchema),
};

const targetedMovementShape = {
  ...movementShape,
  targetVillageId: z.int().positive().nullable(),
  targetVillageName: z.string().nullable(),
  targetTileId: tileIdSchema,
};

export const troopMovementItemDtoSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      ...movementShape,
      type: z.literal('troopMovementAdventure'),
    }),
    z.strictObject({
      ...targetedMovementShape,
      type: troopMovementTypeSchema.extract([
        'troopMovementReinforcements',
        'troopMovementRelocation',
        'troopMovementFindNewVillage',
      ]),
    }),
    z.strictObject({
      ...targetedMovementShape,
      type: troopMovementTypeSchema.extract([
        'troopMovementAttack',
        'troopMovementRaid',
        'troopMovementOasisOccupation',
      ]),
      troops: z.array(troopSchema).nullable(),
    }),
    z.strictObject({
      ...targetedMovementShape,
      type: z.literal('troopMovementReturn'),
      loot: lootSchema.optional(),
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
    count: z.int().positive(),
    earliestResolvesAt: z.number(),
  })
  .meta({ id: 'TroopMovementStatsItemDto' });

export type TroopMovementStatsItemDto = z.infer<
  typeof troopMovementStatsItemDtoSchema
>;
