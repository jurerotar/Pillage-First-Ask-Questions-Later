import { z } from 'zod';
import { battleSchema, battleTroopsSchema } from '../models/battle';
import { combatSimulatorStateSchema } from '../models/combat-simulator';
import { battleReportSchema } from '../models/report';

const simulatorTroopsSchema = battleTroopsSchema.omit({ id: true });

export const combatSimulatorReportDtoSchema = battleReportSchema
  .pick({ type: true })
  .extend({
    combatMode: combatSimulatorStateSchema.shape.combatMode,
    playerRole: combatSimulatorStateSchema.shape.playerRole,
    battle: battleSchema.omit({ id: true }).extend({
      attacker: simulatorTroopsSchema,
      defender: simulatorTroopsSchema.extend({
        reinforcements: z.array(
          simulatorTroopsSchema.extend({ id: z.string() }),
        ),
      }),
    }),
  });

export type CombatSimulatorReportDto = z.infer<
  typeof combatSimulatorReportDtoSchema
>;
