import { describe, expect, test } from 'vitest';
import { calculateOptimalOasisAttackComposition } from '../oasis-attack-optimizer';

const animals = [
  {
    unitId: 'RAT',
    amount: 20,
  },
  {
    unitId: 'SPIDER',
    amount: 10,
  },
] as const;

const availableUnits = [
  {
    unitId: 'CLUBSWINGER',
    amount: 120,
  },
  {
    unitId: 'AXEMAN',
    amount: 50,
  },
  {
    unitId: 'TEUTONIC_KNIGHT',
    amount: 12,
  },
] as const;

const unitCombatStats = [
  {
    unitId: 'CLUBSWINGER',
    attack: 40,
    infantryDefence: 20,
    cavalryDefence: 5,
  },
  {
    unitId: 'AXEMAN',
    attack: 60,
    infantryDefence: 30,
    cavalryDefence: 30,
  },
  {
    unitId: 'TEUTONIC_KNIGHT',
    attack: 150,
    infantryDefence: 50,
    cavalryDefence: 75,
  },
] as const;

describe(calculateOptimalOasisAttackComposition, () => {
  test('returns deterministic results for the same inputs', () => {
    const firstResult = calculateOptimalOasisAttackComposition(
      animals,
      availableUnits,
      unitCombatStats,
    );
    const secondResult = calculateOptimalOasisAttackComposition(
      animals,
      availableUnits,
      unitCombatStats,
    );

    expect(firstResult).toStrictEqual(secondResult);
  });

  test('only returns available attacking units and respects available amounts', () => {
    const result = calculateOptimalOasisAttackComposition(
      animals,
      [
        ...availableUnits,
        {
          unitId: 'TEUTONIC_SCOUT',
          amount: 100,
        },
      ],
      unitCombatStats,
    );

    expect(result.bestComposition.length).toBeGreaterThan(0);
    expect(result.bestComposition).not.toContainEqual({
      unitId: 'TEUTONIC_SCOUT',
      amount: expect.any(Number),
    });

    for (const unit of result.bestComposition) {
      const availableUnit = availableUnits.find(
        ({ unitId }) => unitId === unit.unitId,
      );

      expect(availableUnit).toBeDefined();
      expect(unit.amount).toBeGreaterThan(0);
      expect(unit.amount).toBeLessThanOrEqual(availableUnit!.amount);
    }
  });

  test('returns an infinite score when no attacking units are available', () => {
    const result = calculateOptimalOasisAttackComposition(
      animals,
      [
        {
          unitId: 'TEUTONIC_SCOUT',
          amount: 100,
        },
      ],
      [],
    );

    expect(result).toStrictEqual({
      bestComposition: [],
      objectiveScore: Number.POSITIVE_INFINITY,
      lossPercentage: Number.POSITIVE_INFINITY,
      unitLosses: [],
      totalLossCost: 0,
    });
  });

  test('uses supplied improved combat stats when calculating the result', () => {
    const baselineResult = calculateOptimalOasisAttackComposition(
      animals,
      [
        {
          unitId: 'CLUBSWINGER',
          amount: 80,
        },
      ],
      [
        {
          unitId: 'CLUBSWINGER',
          attack: 40,
          infantryDefence: 20,
          cavalryDefence: 5,
        },
      ],
    );
    const improvedResult = calculateOptimalOasisAttackComposition(
      animals,
      [
        {
          unitId: 'CLUBSWINGER',
          amount: 80,
        },
      ],
      [
        {
          unitId: 'CLUBSWINGER',
          attack: 80,
          infantryDefence: 20,
          cavalryDefence: 5,
        },
      ],
    );

    expect(improvedResult.lossPercentage).toBeLessThan(
      baselineResult.lossPercentage,
    );
    expect(improvedResult.totalLossCost).toBeLessThan(
      baselineResult.totalLossCost,
    );
  });
});
