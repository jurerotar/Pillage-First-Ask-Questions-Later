import { describe, expect, test } from 'vitest';
import {
  calculateBattleUnitLosses,
  calculateCombatStatistics,
  calculateLootableCarryCapacity,
  calculateSurvivingCarryCapacity,
  distributeLoot,
} from '../combat';

describe(calculateBattleUnitLosses, () => {
  test('reports no casualties when all troops remain', () => {
    const unit = {
      amountBefore: 100,
      amountAfter: 100,
      amountHospitalized: 0,
      amountImprisoned: 0,
    };

    const losses = calculateBattleUnitLosses(unit);

    expect(losses).toStrictEqual({ casualties: 0, dead: 0 });
    expect(
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        losses.dead,
    ).toBe(unit.amountBefore);
  });

  test('separates deaths, hospitalized casualties, and prisoners', () => {
    const unit = {
      amountBefore: 100,
      amountAfter: 60,
      amountHospitalized: 10,
      amountImprisoned: 20,
    };

    const losses = calculateBattleUnitLosses(unit);

    expect(losses).toStrictEqual({ casualties: 20, dead: 10 });
    expect(
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        losses.dead,
    ).toBe(unit.amountBefore);
  });

  test('reports no casualties when all troops are imprisoned', () => {
    const unit = {
      amountBefore: 100,
      amountAfter: 0,
      amountHospitalized: 0,
      amountImprisoned: 100,
    };

    const losses = calculateBattleUnitLosses(unit);

    expect(losses).toStrictEqual({ casualties: 0, dead: 0 });
    expect(
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        losses.dead,
    ).toBe(unit.amountBefore);
  });

  test('reports no deaths when all casualties are hospitalized', () => {
    const unit = {
      amountBefore: 100,
      amountAfter: 0,
      amountHospitalized: 100,
      amountImprisoned: 0,
    };

    const losses = calculateBattleUnitLosses(unit);

    expect(losses).toStrictEqual({ casualties: 100, dead: 0 });
    expect(
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        losses.dead,
    ).toBe(unit.amountBefore);
  });

  test('reports all troops dead when none remain or can recover', () => {
    const unit = {
      amountBefore: 100,
      amountAfter: 0,
      amountHospitalized: 0,
      amountImprisoned: 0,
    };

    const losses = calculateBattleUnitLosses(unit);

    expect(losses).toStrictEqual({ casualties: 100, dead: 100 });
    expect(
      unit.amountAfter +
        unit.amountHospitalized +
        unit.amountImprisoned +
        losses.dead,
    ).toBe(unit.amountBefore);
  });
});

describe(calculateLootableCarryCapacity, () => {
  test('subtracts cranny capacity from total available loot', () => {
    expect(calculateLootableCarryCapacity([100, 100, 100, 100], 500, 100)).toBe(
      300,
    );
  });

  test('does not exceed troop carry capacity', () => {
    expect(calculateLootableCarryCapacity([100, 100, 100, 100], 50, 100)).toBe(
      50,
    );
  });

  test('returns 0 when cranny protects all available resources', () => {
    expect(calculateLootableCarryCapacity([10, 20, 30, 40], 500, 100)).toBe(0);
  });
});

describe(distributeLoot, () => {
  test('returns no loot when carry capacity is 0', () => {
    expect(distributeLoot([100, 100, 100, 100], 0)).toStrictEqual([0, 0, 0, 0]);
  });

  test('does not loot more than available resources', () => {
    expect(distributeLoot([10, 20, 30, 40], 1000)).toStrictEqual([
      10, 20, 30, 40,
    ]);
  });

  test('distributes carry capacity evenly across available resources', () => {
    expect(distributeLoot([100, 100, 100, 100], 40)).toStrictEqual([
      10, 10, 10, 10,
    ]);
  });

  test('redistributes capacity when a resource is exhausted', () => {
    expect(distributeLoot([1000, 20, 300, 5], 250)).toStrictEqual([
      113, 20, 112, 5,
    ]);
  });

  test('skips empty resource buckets', () => {
    expect(distributeLoot([0, 100, 0, 50], 75)).toStrictEqual([0, 38, 0, 37]);
  });
});

describe(calculateCombatStatistics, () => {
  test('returns zero statistics for an empty army', () => {
    expect(calculateCombatStatistics([])).toStrictEqual({
      supplyBefore: 0,
      supplyLost: 0,
      resourcesLost: 0,
    });
  });

  test('totals mixed units using supplied upkeep and costs, excluding prisoners', () => {
    const statistics = calculateCombatStatistics([
      {
        unitId: 'LEGIONNAIRE',
        amountBefore: 10,
        amountAfter: 8,
        amountHospitalized: 0,
        amountImprisoned: 0,
        unitWheatConsumption: 1,
        baseRecruitmentCost: [120, 100, 150, 30],
      },
      {
        unitId: 'EQUITES_IMPERATORIS',
        amountBefore: 10,
        amountAfter: 6,
        amountHospitalized: 1,
        amountImprisoned: 2,
        unitWheatConsumption: 3,
        baseRecruitmentCost: [550, 440, 320, 100],
      },
    ]);

    expect(statistics).toStrictEqual({
      supplyBefore: 40,
      supplyLost: 8,
      resourcesLost: 3620,
    });
  });

  test('counts no losses when all missing troops are prisoners', () => {
    const statistics = calculateCombatStatistics([
      {
        unitId: 'LEGIONNAIRE',
        amountBefore: 10,
        amountAfter: 0,
        amountHospitalized: 0,
        amountImprisoned: 10,
        unitWheatConsumption: 1,
        baseRecruitmentCost: [120, 100, 150, 30],
      },
    ]);

    expect(statistics).toStrictEqual({
      supplyBefore: 10,
      supplyLost: 0,
      resourcesLost: 0,
    });
  });
});

describe(calculateSurvivingCarryCapacity, () => {
  test('returns zero capacity for an empty army', () => {
    expect(calculateSurvivingCarryCapacity([])).toBe(0);
  });

  test('uses surviving amounts and supplied carry values', () => {
    const capacity = calculateSurvivingCarryCapacity([
      { amountAfter: 8, unitCarryCapacity: 75 },
      { amountAfter: 6, unitCarryCapacity: 150 },
      { amountAfter: 0, unitCarryCapacity: 100 },
      { amountAfter: 10, unitCarryCapacity: 0 },
    ]);

    expect(capacity).toBe(1500);
  });
});
