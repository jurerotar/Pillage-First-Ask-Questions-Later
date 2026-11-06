import { z } from 'zod';
import { buildingIdSchema } from './building';
import { coordinatesSchema } from './coordinates';
import { resourceBundleSchema } from './resource';
import { tileIdSchema } from './tile';
import { tribeSchema } from './tribe';
import { natureUnitIdSchema, unitIdSchema } from './unit';

export const battleStatisticsSchema = z.strictObject({
  points: z.int(),
  supplyBefore: z.int(),
  supplyLost: z.int(),
  resourcesLost: z.int(),
});

export const battleUnitSchema = z.strictObject({
  unitId: unitIdSchema,
  amountBefore: z.int().nonnegative(),
  amountAfter: z.int().nonnegative(),
  amountHospitalized: z.int().nonnegative(),
  amountImprisoned: z.int().nonnegative(),
  amountBandaged: z.int().nonnegative(),
  amountConsumed: z.int().nonnegative(),
});

export const battleHeroOutcomeSchema = z.strictObject({
  heroId: z.int(),
  healthBefore: z.int().min(0).max(100),
  healthAfter: z.int().min(0).max(100),
  experienceGained: z.int().nonnegative(),
  consumables: z.array(
    z.strictObject({ itemId: z.int(), amount: z.int().positive() }),
  ),
});

export const battleRescuedUnitSchema = z.strictObject({
  playerId: z.int(),
  homeTileId: tileIdSchema,
  unitId: unitIdSchema,
  // Freed includes troops that die during the rescue.
  amountFreed: z.int().positive(),
  amountDied: z.int().nonnegative(),
});

export const battleCapturedAnimalSchema = z.strictObject({
  unitId: natureUnitIdSchema,
  amount: z.int().positive(),
});

export const battleStolenItemSchema = z.strictObject({
  itemId: z.int(),
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

export const battleConquestSchema = z.discriminatedUnion('target', [
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
]);

export const battleTroopsSchema = z.strictObject({
  id: z.int(),
  tribe: tribeSchema,
  units: z.array(battleUnitSchema),
  hero: battleHeroOutcomeSchema.nullable(),
});

export const battlePlayerSchema = z.strictObject({
  id: z.int().nullable(),
  name: z.string(),
  slug: z.string().optional(),
});

export const battleVillageSchema = z.strictObject({
  id: z.int().nullable(),
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

export const battleOutcomeSchema = z.strictObject({
  loot: resourceBundleSchema,
  totalCarryCapacity: z.int(),
  canAttackerSeeFullReport: z.boolean(),
  loyaltyBefore: z.number().min(0).max(125).nullable(),
  loyaltyAfter: z.number().min(0).max(125).nullable(),
  conquest: battleConquestSchema.nullable(),
  villageDestroyed: z.boolean(),
  trapsDestroyed: z.int().nonnegative(),
  rescuedUnits: z.array(battleRescuedUnitSchema),
  capturedAnimals: z.array(battleCapturedAnimalSchema),
  stolenItems: z.array(battleStolenItemSchema),
});

export const battleDamagedBuildingSchema = z.strictObject({
  buildingId: buildingIdSchema,
  levelBefore: z.int().nonnegative(),
  levelAfter: z.int().nonnegative(),
});

export const battleSummarySchema = z.strictObject({
  isRaid: z.boolean(),
  originName: z.string(),
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
});

export const battleSchema = z.strictObject({
  id: z.int(),
  attacker: battleParticipantSchema,
  defender: battleDefenderSchema,
  outcome: battleOutcomeSchema,
  damagedBuildings: z.array(battleDamagedBuildingSchema),
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
export type BattleDamagedBuilding = z.infer<typeof battleDamagedBuildingSchema>;
export type BattleType = z.infer<typeof battleSchema>;
