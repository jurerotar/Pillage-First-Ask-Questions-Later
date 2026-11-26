import { z } from 'zod';
import {
  combatInputSchema,
  combatModeSchema,
  combatResultSchema,
} from '../models/combat';
import { battleReportSchema } from '../models/report';

const playerRoleSchema = z.enum(['attacker', 'defender']);

export const combatRequestDtoSchema = combatInputSchema.safeExtend({
  playerRole: playerRoleSchema,
});

export const combatDtoSchema = z.strictObject({
  ...battleReportSchema.pick({ type: true }).shape,
  combatMode: combatModeSchema,
  playerRole: playerRoleSchema,
  battle: combatResultSchema,
});

export type CombatDto = z.infer<typeof combatDtoSchema>;
