import { z } from 'zod';
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
  battleParticipantId: z.int(),
  unitId: unitIdSchema,
  amountBefore: z.int(),
  amountAfter: z.int(),
});

export const battleParticipantSchema = z.strictObject({
  id: z.int(),
  role: z.enum(['attacker', 'defender']),
  tribe: tribeSchema,
  isReinforcement: z.boolean(),
  units: z.array(battleUnitSchema),
});

export const battleSummarySchema = z.strictObject({
  isRaid: z.boolean(),
  originName: z.string(),
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
});

export const battleTypeSchema = z.strictObject({
  id: z.int(),
  originTileId: z.int(),
  targetTileId: z.int(),
  isRaid: z.boolean(),
  attackingPlayerName: z.string(),
  attackingPlayerSlug: z.string(),
  defendingPlayerName: z.string(),
  defendingPlayerSlug: z.string().optional(),
  originName: z.string(),
  originCoordinates: coordinatesSchema,
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
  loot: resourceBundleSchema,
  totalCarryCapacity: z.int(),
  didAttackerWin: z.boolean(),
  canAttackerSeeFullReport: z.boolean(),
  attackStatistics: battleStatisticsSchema,
  defenceStatistics: battleStatisticsSchema,
  participants: z.array(battleParticipantSchema),
});

export type BattleStatistics = z.infer<typeof battleStatisticsSchema>;
export type BattleUnit = z.infer<typeof battleUnitSchema>;
export type BattleParticipant = z.infer<typeof battleParticipantSchema>;
export type BattleSummary = z.infer<typeof battleSummarySchema>;
export type BattleType = z.infer<typeof battleTypeSchema>;
