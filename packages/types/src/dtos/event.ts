import { z } from 'zod';
import { buildingIdSchema } from '../models/building';
import { effectIdSchema } from '../models/effect';
import { gameEventTypeSchema } from '../models/game-event';
import { resourceBundleSchema } from '../models/resource';
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
  duration: z.number().optional(),
};

const villageEventSchema = {
  villageId: z.number(),
  ...optionalTimingSchema,
};

const globalEventSchema = {
  villageId: z.null(),
  ...optionalTimingSchema,
};

const buildingEventSchema = {
  ...villageEventSchema,
  buildingFieldId: z.number(),
  buildingId: buildingIdSchema,
  level: z.number(),
  previousLevel: z.number(),
};

const troopMovementEventSchema = {
  ...villageEventSchema,
  troops: z.array(troopSchema),
  originTileId: z.number(),
  targetTileId: z.number(),
};

const resourcesSchema = z.strictObject({
  wood: z.number(),
  clay: z.number(),
  iron: z.number(),
  wheat: z.number(),
});

const merchantMovementEventSchema = {
  ...villageEventSchema,
  originTileId: z.number(),
  targetTileId: z.number(),
  targetVillageId: z.number(),
  resources: resourcesSchema,
};

const resourceTransferEventSchema = {
  ...merchantMovementEventSchema,
  merchantAmount: z.number(),
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
      type: z.literal('buildingScheduledConstruction'),
      ...buildingEventSchema,
    }),
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
      batchId: z.string(),
      amount: z.number(),
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
      level: z.number(),
    }),
    z.strictObject({
      type: z.literal('animalCageProduction'),
      ...villageEventSchema,
      cageAmount: z.number(),
    }),
    z.strictObject({
      type: z.literal('trapperCageProduction'),
      ...villageEventSchema,
      cageAmount: z.number(),
    }),
    z.strictObject({
      type: z.literal('huntersLodgeHunt'),
      ...villageEventSchema,
      huntingPartyLevel: z.number(),
    }),
    z.strictObject({
      type: z.literal('gatherersHutGatheringTrip'),
      ...villageEventSchema,
      troops: z.array(troopSchema),
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
      type: z.literal('heroHealthRegeneration'),
      ...globalEventSchema,
    }),
    z.strictObject({
      type: z.literal('loyaltyIncrease'),
      ...globalEventSchema,
    }),
    z.strictObject({
      type: z.literal('resourceTransfer'),
      ...resourceTransferEventSchema,
    }),
    z.strictObject({
      type: z.literal('tradeRoute'),
      ...merchantMovementEventSchema,
      interval: z.number(),
    }),
  ])
  .meta({ id: 'CreateEventDto' });
