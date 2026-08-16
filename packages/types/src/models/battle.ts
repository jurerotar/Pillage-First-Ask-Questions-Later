import { z } from 'zod';
import { buildingIdSchema } from './building';
import { coordinatesSchema } from './coordinates';
import { resourceBundleSchema } from './resource';
import { tribeSchema } from './tribe';
import { unitIdSchema } from './unit';

export const battleStatisticsSchema = z.strictObject({
  points: z.int(),
  supplyBefore: z.int(),
  supplyLost: z.int(),
  resourcesLost: z.int(),
});

export const battleUnitSchema = z.strictObject({
  unitId: unitIdSchema,
  amountBefore: z.int(),
  amountAfter: z.int(),
  amountHospitalized: z.int(),
  amountImprisoned: z.int(),
});

export const battleTroopsSchema = z.strictObject({
  id: z.int(),
  tribe: tribeSchema,
  units: z.array(battleUnitSchema),
});

export const battlePlayerSchema = z.strictObject({
  id: z.int().nullable(),
  name: z.string(),
  slug: z.string().optional(),
});

export const battleVillageSchema = z.strictObject({
  id: z.int().nullable(),
  tileId: z.int(),
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
export type BattlePlayer = z.infer<typeof battlePlayerSchema>;
export type BattleVillage = z.infer<typeof battleVillageSchema>;
export type BattleParticipant = z.infer<typeof battleParticipantSchema>;
export type BattleDefender = z.infer<typeof battleDefenderSchema>;
export type BattleOutcome = z.infer<typeof battleOutcomeSchema>;
export type BattleDamagedBuilding = z.infer<typeof battleDamagedBuildingSchema>;
export type BattleSummary = z.infer<typeof battleSummarySchema>;
export type BattleType = z.infer<typeof battleSchema>;
