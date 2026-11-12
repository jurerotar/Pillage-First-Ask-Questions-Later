import { z } from 'zod';
import { buildingIdSchema } from './building';
import { coordinatesSchema } from './coordinates';
import { resourceBundleSchema } from './resource';
import { tileIdSchema } from './tile';
import { tribeSchema } from './tribe';
import { natureUnitIdSchema, unitIdSchema } from './unit';

export const battleStatisticsSchema = z
  .strictObject({
    points: z.int().nonnegative(),
    supplyBefore: z.int().nonnegative(),
    supplyLost: z.int().nonnegative(),
    resourcesLost: z.int().nonnegative(),
  })
  .refine(({ supplyBefore, supplyLost }) => supplyLost <= supplyBefore, {
    message: 'Lost supply cannot exceed initial supply',
  });

export const battleUnitSchema = z
  .strictObject({
    unitId: unitIdSchema,
    amountBefore: z.int().nonnegative(),
    amountAfter: z.int().nonnegative(),
    amountHospitalized: z.int().nonnegative(),
    amountImprisoned: z.int().nonnegative(),
    amountBandaged: z.int().nonnegative(),
    amountConsumed: z.int().nonnegative(),
  })
  .refine(
    (unit) =>
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        unit.amountBandaged +
        unit.amountConsumed <=
      unit.amountBefore,
    { message: 'Unit outcomes cannot exceed the initial amount' },
  );

export const battleHeroOutcomeSchema = z.strictObject({
  heroId: z.int().positive(),
  healthBefore: z.int().min(1).max(100),
  healthAfter: z.int().min(0).max(100),
  experienceGained: z.int().nonnegative(),
  consumables: z.array(
    z.strictObject({ itemId: z.int().positive(), amount: z.int().positive() }),
  ),
});

export const battleRescuedUnitSchema = z
  .strictObject({
    playerId: z.int().positive(),
    homeTileId: tileIdSchema,
    unitId: unitIdSchema,
    // Freed includes troops that die during the rescue.
    amountFreed: z.int().positive(),
    amountDied: z.int().nonnegative(),
  })
  .refine(({ amountFreed, amountDied }) => amountDied <= amountFreed, {
    message: 'Rescue deaths cannot exceed freed troops',
  });

export const battleCapturedAnimalSchema = z.strictObject({
  unitId: natureUnitIdSchema,
  amount: z.int().positive(),
});

export const battleStolenItemSchema = z.strictObject({
  itemId: z.int().positive(),
  amount: z.int().positive(),
});

export const villageConquestFailureReasonSchema = z.enum([
  'no-surviving-administrator',
  'defenders-survived',
  'administration-building-present',
  'target-is-capital',
  'target-is-last-village',
  'insufficient-culture-points',
  'no-free-expansion-slot',
  'loyalty-not-zero',
]);

export const oasisCaptureFailureReasonSchema = z.enum([
  'no-surviving-hero',
  'defenders-survived',
  'out-of-range',
  'no-free-oasis-slot',
  'loyalty-not-zero',
]);

export const battleConquestSchema = z
  .discriminatedUnion('target', [
    z.strictObject({
      target: z.literal('village'),
      succeeded: z.boolean(),
      failureReason: villageConquestFailureReasonSchema.nullable(),
    }),
    z.strictObject({
      target: z.literal('oasis'),
      succeeded: z.boolean(),
      failureReason: oasisCaptureFailureReasonSchema.nullable(),
    }),
  ])
  .refine(
    ({ succeeded, failureReason }) => succeeded === (failureReason === null),
    {
      message:
        'Failed conquests require a reason; successful conquests cannot have one',
    },
  );

export const battleTroopsSchema = z.strictObject({
  id: z.int().positive(),
  tribe: tribeSchema,
  units: z.array(battleUnitSchema),
  hero: battleHeroOutcomeSchema.nullable(),
});

export const battlePlayerSchema = z.strictObject({
  id: z.int().positive().nullable(),
  name: z.string(),
  slug: z.string().optional(),
});

export const battleVillageSchema = z.strictObject({
  id: z.int().positive().nullable(),
  tileId: tileIdSchema,
  name: z.string(),
  coordinates: coordinatesSchema,
});

export const battleParticipantSchema = z.strictObject({
  player: battlePlayerSchema,
  village: battleVillageSchema,
  troops: battleTroopsSchema,
});

export const battleDefenderSchema = battleParticipantSchema.extend({
  reinforcements: z.array(battleParticipantSchema),
});

export const battleOutcomeSchema = z
  .strictObject({
    loot: resourceBundleSchema,
    totalCarryCapacity: z.int().nonnegative(),
    loyaltyBefore: z.number().min(0).max(125).nullable(),
    loyaltyAfter: z.number().min(0).max(125).nullable(),
    conquest: battleConquestSchema.nullable(),
    villageDestroyed: z.boolean(),
    trapsDestroyed: z.int().nonnegative(),
    rescuedUnits: z.array(battleRescuedUnitSchema),
    capturedAnimals: z.array(battleCapturedAnimalSchema),
    stolenItems: z.array(battleStolenItemSchema),
  })
  .refine(
    ({ loyaltyBefore, loyaltyAfter, conquest }) => {
      if ((loyaltyBefore === null) !== (loyaltyAfter === null)) {
        return false;
      }
      if (conquest === null) {
        return loyaltyBefore === null;
      }
      if (
        loyaltyBefore !== null &&
        loyaltyAfter !== null &&
        loyaltyAfter > loyaltyBefore
      ) {
        return false;
      }
      return (
        !conquest.succeeded || (loyaltyBefore !== null && loyaltyAfter === 0)
      );
    },
    {
      message:
        'Loyalty values must describe the conquest attempt, with zero loyalty after success',
    },
  );

export const battleSiegeResultSchema = z
  .strictObject({
    // Null only when there is no actual target.
    fieldId: z.int().min(1).max(40).nullable(),
    requestedBuildingId: buildingIdSchema.nullable(),
    buildingId: buildingIdSchema.nullable(),
    targeting: z.enum([
      'selected',
      'random',
      'brewery',
      'confusion',
      'fallback',
    ]),
    outcome: z.enum([
      'damaged',
      'destroyed',
      'undamaged',
      'not-fired',
      'no-target',
    ]),
    reason: z
      .enum([
        'insufficient-power',
        'no-surviving-siege',
        'raid',
        'target-missing',
      ])
      .nullable(),
    levelBefore: z.int().positive().nullable(),
    levelAfter: z.int().nonnegative().nullable(),
  })
  .refine(
    (result) => {
      const { buildingId, fieldId, levelBefore, levelAfter, outcome, reason } =
        result;
      const hasTarget =
        buildingId !== null &&
        fieldId !== null &&
        levelBefore !== null &&
        levelAfter !== null;
      const noTarget =
        buildingId === null &&
        fieldId === null &&
        levelBefore === null &&
        levelAfter === null;
      if (
        result.targeting === 'selected' &&
        (result.requestedBuildingId === null ||
          (buildingId !== null && buildingId !== result.requestedBuildingId))
      ) {
        return false;
      }
      if (
        result.targeting === 'random' &&
        result.requestedBuildingId !== null
      ) {
        return false;
      }
      if (
        result.targeting === 'fallback' &&
        result.requestedBuildingId === null
      ) {
        return false;
      }
      switch (outcome) {
        case 'damaged':
          return (
            hasTarget &&
            levelAfter > 0 &&
            levelAfter < levelBefore &&
            reason === null
          );
        case 'destroyed':
          return hasTarget && levelAfter === 0 && reason === null;
        case 'undamaged':
          return (
            hasTarget &&
            levelAfter === levelBefore &&
            reason === 'insufficient-power'
          );
        case 'not-fired':
          return (
            (noTarget || (hasTarget && levelAfter === levelBefore)) &&
            (reason === 'raid' || reason === 'no-surviving-siege')
          );
        case 'no-target':
          return noTarget && reason === 'target-missing';
      }
    },
    { message: 'Siege outcome must match its target, levels, and reason' },
  );

export const battleSummarySchema = z.strictObject({
  isRaid: z.boolean(),
  originName: z.string(),
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
});

export const battleSchema = z.strictObject({
  id: z.int().positive(),
  attacker: battleParticipantSchema,
  defender: battleDefenderSchema,
  outcome: battleOutcomeSchema,
  siegeResults: z.array(battleSiegeResultSchema),
  statistics: z.strictObject({
    attacker: battleStatisticsSchema,
    defender: battleStatisticsSchema,
  }),
});

export type BattleStatistics = z.infer<typeof battleStatisticsSchema>;
export type BattleUnit = z.infer<typeof battleUnitSchema>;
export type BattleTroops = z.infer<typeof battleTroopsSchema>;
export type BattleParticipant = z.infer<typeof battleParticipantSchema>;
export type BattleOutcome = z.infer<typeof battleOutcomeSchema>;
export type BattleSiegeResult = z.infer<typeof battleSiegeResultSchema>;
export type BattleType = z.infer<typeof battleSchema>;
