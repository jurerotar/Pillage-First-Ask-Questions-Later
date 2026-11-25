import { z } from 'zod';
import {
  battleHeroOutcomeSchema,
  battleSchema,
  battleTroopsSchema,
} from '../models/battle';
import { combatSimulatorStateSchema } from '../models/combat-simulator';
import { battleReportSchema } from '../models/report';

const simulatorTroopsSchema = z.strictObject({
  ...battleTroopsSchema.omit({ id: true }).shape,
  hero: battleHeroOutcomeSchema.omit({ heroId: true }).nullable(),
});

export const combatSimulatorReportDtoSchema = z.strictObject({
  ...battleReportSchema.pick({ type: true }).shape,
  combatMode: combatSimulatorStateSchema.shape.combatMode,
  playerRole: combatSimulatorStateSchema.shape.playerRole,
  battle: z.strictObject({
    ...battleSchema.omit({ id: true }).shape,
    attacker: simulatorTroopsSchema,
    defender: z.strictObject({
      ...simulatorTroopsSchema.shape,
      reinforcements: z.array(
        z.strictObject({ ...simulatorTroopsSchema.shape, id: z.string() }),
      ),
    }),
  }),
});

export type CombatSimulatorReportDto = z.infer<
  typeof combatSimulatorReportDtoSchema
>;
