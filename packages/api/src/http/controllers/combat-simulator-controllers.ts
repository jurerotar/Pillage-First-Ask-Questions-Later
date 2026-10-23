import {
  type CombatSimulatorReportDto,
  combatSimulatorReportDtoSchema,
} from '@pillage-first/types/dtos/combat-simulator';
import { combatSimulatorStateSchema } from '@pillage-first/types/models/combat-simulator';
import { createController } from '../controller';
import { mapUnits } from './mappers/combat-simulator-mapper';

export const simulateCombat = createController('/combat-simulator', 'query', {
  summary: 'Preview a combat simulator report',
  requestBody: combatSimulatorStateSchema,
  response: combatSimulatorReportDtoSchema,
})(({ body }): CombatSimulatorReportDto => {
  const { combatMode, playerRole, attacker, defender } = body;

  // Placeholder report: combat resolution will be added later.
  return {
    type: 'battle',
    combatMode,
    playerRole,
    battle: {
      attacker: { tribe: attacker.tribe, units: mapUnits(attacker.troops) },
      defender: {
        tribe: defender.tribe,
        units: mapUnits(defender.troops),
        reinforcements: defender.reinforcements.map(
          ({ id, tribe, troops }) => ({
            id,
            tribe,
            units: mapUnits(troops),
          }),
        ),
      },
      outcome: {
        loot: [0, 0, 0, 0],
        totalCarryCapacity: 0,
        canAttackerSeeFullReport: true,
        itemId: null,
        itemAmount: null,
      },
      damagedBuildings: [],
      statistics: {
        attacker: {
          points: 0,
          supplyBefore: 0,
          supplyLost: 0,
          resourcesLost: 0,
        },
        defender: {
          points: 0,
          supplyBefore: 0,
          supplyLost: 0,
          resourcesLost: 0,
        },
      },
    },
  };
});
