import { z } from 'zod';
import { coordinatesSchema } from './coordinates';
import { tribeSchema } from './tribe';
import { unitIdSchema } from './unit';

export const lootSchema = z.tuple([z.int(), z.int(), z.int(), z.int()]);

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

export const battleTypeSchema = z.strictObject({
  attackingPlayerName: z.string(),
  attackingPlayerSlug: z.string(),
  defendingPlayerName: z.string(),
  defendingPlayerSlug: z.string(),
  originVillageName: z.string(),
  originVillageCoordinates: coordinatesSchema,
  targetVillageName: z.string(),
  targetVillageCoordinates: coordinatesSchema,
  loot: lootSchema,
  totalCarryCapacity: z.int(),
  didAttackerWin: z.boolean(),
  canAttackerSeeFullReport: z.boolean(),
  attackStatistics: battleStatisticsSchema,
  defenceStatistics: battleStatisticsSchema,
  participants: z.array(battleParticipantSchema),
});

export type Loot = z.infer<typeof lootSchema>;
export type BattleStatistics = z.infer<typeof battleStatisticsSchema>;
export type BattleUnit = z.infer<typeof battleUnitSchema>;
export type BattleParticipant = z.infer<typeof battleParticipantSchema>;
export type BattleType = z.infer<typeof battleTypeSchema>;
