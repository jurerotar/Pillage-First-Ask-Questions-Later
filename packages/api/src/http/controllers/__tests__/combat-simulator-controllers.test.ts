import { describe, expect, test } from 'vitest';
import { combatSimulatorReportDtoSchema } from '@pillage-first/types/dtos/combat-simulator';
import {
  type CombatSimulatorState,
  combatSimulatorStateSchema,
} from '@pillage-first/types/models/combat-simulator';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { matchRoute } from '../../route-matcher';
import { simulateCombat } from '../combat-simulator-controllers';

const createState = (): CombatSimulatorState => {
  const heroStats = {
    hp: 100,
    strength: 0,
    attackBonus: 0,
    defenceBonus: 0,
    mounted: false,
    itemIdsBySlot: {},
  };

  return {
    combatMode: 'raid',
    playerRole: 'attacker',
    attacker: {
      tribe: 'romans',
      troops: [
        { unitId: 'LEGIONNAIRE', amount: 100, smithyImprovementLevel: 20 },
      ],
      heroStats,
      village: { breweryLevel: 0 },
    },
    defender: {
      tribe: 'gauls',
      troops: [{ unitId: 'PHALANX', amount: 50, smithyImprovementLevel: 0 }],
      heroStats,
      village: { wallLevel: 20, residenceLevel: 20, trapCount: 1200 },
      reinforcements: [
        {
          id: 'reinforcement-1',
          tribe: 'romans',
          troops: [
            { unitId: 'PRAETORIAN', amount: 25, smithyImprovementLevel: 5 },
          ],
          village: undefined,
        },
      ],
    },
  };
};

describe('combat-simulator-controllers', () => {
  test.each(['attack', 'raid'] as const)(
    'accepts serialized %s state and returns a report without database access',
    (combatMode) => {
      const state = createState();
      state.combatMode = combatMode;
      state.playerRole = 'defender';
      const originalState = structuredClone(state);
      const route = matchRoute(
        '/combat-simulator',
        'QUERY',
        JSON.parse(JSON.stringify(state)),
      );

      const database = new Proxy({} as DbFacade, {
        get() {
          throw new Error('Simulator must not access the database');
        },
      });

      const report = simulateCombat(database, {
        ...route,
        body: combatSimulatorStateSchema.parse(route.body),
      });

      expect(combatSimulatorReportDtoSchema.parse(report)).toStrictEqual(
        report,
      );
      expect(report.combatMode).toBe(combatMode);
      expect(report.playerRole).toBe('defender');
      const participants = [
        report.battle.attacker,
        report.battle.defender,
        ...report.battle.defender.reinforcements,
      ];
      expect(participants.map(({ units }) => units[0].amountBefore)).toEqual([
        100, 50, 25,
      ]);
      for (const { units } of participants) {
        for (const unit of units) {
          expect(unit.amountAfter).toBe(unit.amountBefore);
          expect(unit.amountHospitalized).toBe(0);
          expect(unit.amountImprisoned).toBe(0);
        }
      }
      expect(report.battle.defender.reinforcements[0].id).toBe(
        'reinforcement-1',
      );
      expect(report.battle.outcome.loot).toEqual([0, 0, 0, 0]);
      expect(state).toStrictEqual(originalState);
    },
  );

  test('rejects invalid simulator input at the route boundary', () => {
    const state = createState();
    state.attacker.troops[0].amount = -1;
    expect(() => matchRoute('/combat-simulator', 'QUERY', state)).toThrow();
  });
});
