import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { buildingIdSchema } from '../models/building';
import { effectIdSchema } from '../models/effect';
import {
  catapultTargetsSchema,
  culturePointsCelebrationTypeSchema,
  gameEventTypeSchema,
  heroOasisAnimalActionSchema,
  scoutingTargetSchema,
} from '../models/game-event';
import { resourceBundleSchema, resourcesSchema } from '../models/resource';
import { troopSchema } from '../models/troop';
import { unitIdSchema } from '../models/unit';

// Base shape for API events; specific event types add extra fields via looseObject
export const baseEventDtoSchema = z
  .looseObject({
    id: z.number(),
    type: gameEventTypeSchema,
    startsAt: z.number(),
    duration: z.number(),
    resolvesAt: z.number(),
    villageId: z.number().nullable(),
  })
  .meta({ id: 'BaseEventDto' });

const optionalTimingSchema = {
  startsAt: z.number().optional(),
  duration: z.number().nonnegative().optional(),
};

const villageEventSchema = {
  villageId: z.int().positive(),
  ...optionalTimingSchema,
};

const buildingEventSchema = {
  ...villageEventSchema,
  buildingFieldId: z.int().positive(),
  buildingId: buildingIdSchema,
  level: z.int().nonnegative(),
  previousLevel: z.int().nonnegative(),
};

const troopMovementEventSchema = {
  ...villageEventSchema,
  troops: z.array(troopSchema),
  originTileId: tileIdSchema,
  targetTileId: tileIdSchema,
  scoutingTarget: scoutingTargetSchema.optional(),
  catapultTargets: catapultTargetsSchema.optional(),
  heroOasisAnimalAction: heroOasisAnimalActionSchema.optional(),
};

const merchantMovementEventSchema = {
  ...villageEventSchema,
  originTileId: tileIdSchema,
  targetTileId: tileIdSchema,
  targetVillageId: z.int().positive(),
  resources: resourcesSchema,
};

const resourceTransferEventSchema = {
  ...merchantMovementEventSchema,
  merchantAmount: z.int().positive(),
  repeatRemaining: z.number().int().min(0).max(4),
  repeatResources: resourcesSchema,
};

const troopTrainingDurationEffectIdSchema = effectIdSchema.extract([
  'residenceTrainingDuration',
  'barracksTrainingDuration',
  'greatBarracksTrainingDuration',
  'stableTrainingDuration',
  'greatStableTrainingDuration',
  'workshopTrainingDuration',
  'hospitalTrainingDuration',
]);

const returnMovementTypeSchema = gameEventTypeSchema
  .extract([
    'troopMovementReinforcements',
    'troopMovementRelocation',
    'troopMovementReturn',
    'troopMovementFindNewVillage',
    'troopMovementAttack',
    'troopMovementRaid',
    'troopMovementOasisOccupation',
    'troopMovementAdventure',
  ])
  .or(z.literal('troopMovementReturnReinforcements'));

export const createEventDtoSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('buildingConstruction'),
      ...buildingEventSchema,
    }),
    z.strictObject({
      type: z.literal('buildingLevelChange'),
      ...buildingEventSchema,
    }),
    z.strictObject({
      type: z.literal('buildingDestruction'),
      ...buildingEventSchema,
    }),
    z.strictObject({
      type: z.literal('troopTraining'),
      ...villageEventSchema,
      batchId: z.string().min(1),
      amount: z.int().positive(),
      unitId: unitIdSchema,
      durationEffectId: troopTrainingDurationEffectIdSchema,
      buildingId: buildingIdSchema,
    }),
    z.strictObject({
      type: z.literal('unitResearch'),
      ...villageEventSchema,
      unitId: unitIdSchema,
    }),
    z.strictObject({
      type: z.literal('unitImprovement'),
      ...villageEventSchema,
      unitId: unitIdSchema,
      level: z.int().positive().max(20),
    }),
    z.strictObject({
      type: z.literal('animalCageProduction'),
      ...villageEventSchema,
      batchId: z.string().min(1),
      amount: z.int().positive(),
    }),
    z.strictObject({
      type: z.literal('trapperCageProduction'),
      ...villageEventSchema,
      batchId: z.string().min(1),
      amount: z.int().positive(),
    }),
    z.strictObject({
      type: z.literal('huntersLodgeHunt'),
      ...villageEventSchema,
      huntingPartyLevel: z.int().positive(),
    }),
    z.strictObject({
      type: z.literal('gatherersHutGatheringTrip'),
      ...villageEventSchema,
      troops: z.array(troopSchema).min(1),
    }),
    z.strictObject({
      type: gameEventTypeSchema.extract([
        'troopMovementReinforcements',
        'troopMovementRelocation',
        'troopMovementFindNewVillage',
        'troopMovementAttack',
        'troopMovementRaid',
        'troopMovementOasisOccupation',
        'troopMovementAdventure',
      ]),
      ...troopMovementEventSchema,
      troops: z.array(troopSchema).min(1),
    }),
    z.strictObject({
      type: z.literal('troopMovementReturn'),
      ...troopMovementEventSchema,
      originalMovementType: returnMovementTypeSchema,
      loot: resourceBundleSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('heroRevival'),
      ...villageEventSchema,
    }),
    z.strictObject({
      type: z.literal('culturePointsCelebration'),
      ...villageEventSchema,
      celebrationType: culturePointsCelebrationTypeSchema,
    }),
    z.strictObject({
      type: z.literal('resourceTransfer'),
      ...resourceTransferEventSchema,
    }),
    z.strictObject({
      type: z.literal('tradeRoute'),
      ...villageEventSchema,
      tradeRouteId: z.int().positive(),
    }),
  ])
  .meta({ id: 'CreateEventDto' });
