import { describe, expect, test } from 'vitest';
import {
  egyptianUnits,
  gaulUnits,
  hunUnits,
  natarianUnits,
  natureUnits,
  romanUnits,
  spartanUnits,
  teutonUnits,
} from 'app/assets/units';
import {
  calculateMaxUnits,
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitByTribeAndTier,
  getUnitDefinition,
  getUnitsByTribe,
} from 'app/assets/utils/units';

describe('units', () => {
  const mockUnitId = 'PRAETORIAN';
  const mockUnit = romanUnits.find((u) => u.id === mockUnitId)!;

  test('getUnitData returns unit by id', () => {
    expect(getUnitDefinition(mockUnitId)).toEqual(mockUnit);
  });

  test('getUnitsByTribe returns correct units for each tribe', () => {
    expect(getUnitsByTribe('romans')).toEqual(romanUnits);
    expect(getUnitsByTribe('gauls')).toEqual(gaulUnits);
    expect(getUnitsByTribe('huns')).toEqual(hunUnits);
    expect(getUnitsByTribe('teutons')).toEqual(teutonUnits);
    expect(getUnitsByTribe('egyptians')).toEqual(egyptianUnits);
    expect(getUnitsByTribe('natars')).toEqual(natarianUnits);
    expect(getUnitsByTribe('nature')).toEqual(natureUnits);
    expect(getUnitsByTribe('spartans')).toEqual(spartanUnits);
  });

  test('getUnitByTribeAndTier returns correct unit', () => {
    const unit = getUnitByTribeAndTier('romans', mockUnit.tier);
    expect(unit.tier).toBe(mockUnit.tier);
    expect(getUnitsByTribe('romans')).toContain(unit);
  });

  test('calculateMaxUnits returns correct max number of units', () => {
    const resources = { wood: 1000, clay: 1000, iron: 1000, wheat: 1000 };
    const costs = [100, 200, 300, 400];
    const result = calculateMaxUnits(resources, costs);
    expect(result).toBe(2);
  });

  test('calculateMaxUnits returns 0 if resources are zero', () => {
    const resources = { wood: 0, clay: 0, iron: 0, wheat: 0 };
    const costs = [1, 1, 1, 1];
    expect(calculateMaxUnits(resources, costs)).toBe(0);
  });

  test('calculateUnitUpgradeCostForLevel returns correct cost at level 2', () => {
    const result = calculateUnitUpgradeCostForLevel(mockUnitId, 2);
    expect(result).toEqual([675, 880, 1080, 475]);
  });

  test('calculateUnitUpgradeDurationForLevel returns correct duration at level 2', () => {
    const result = calculateUnitUpgradeDurationForLevel(mockUnitId, 2);
    expect(result).toBe(14_256_000);
  });

  test('Upgrade cost increases consistently with level', () => {
    const level2 = calculateUnitUpgradeCostForLevel(mockUnitId, 2);
    const level3 = calculateUnitUpgradeCostForLevel(mockUnitId, 3);

    for (const [level, cost] of level3.entries()) {
      expect(cost).toBeGreaterThan(level2[level]);
    }
  });

  test('Upgrade duration increases with level', () => {
    const level2 = calculateUnitUpgradeDurationForLevel(mockUnitId, 2);
    const level3 = calculateUnitUpgradeDurationForLevel(mockUnitId, 3);
    expect(level3).toBeGreaterThan(level2);
  });

  test('calculateUnitResearchCost returns correct values', () => {
    const result = calculateUnitResearchCost(mockUnitId);
    expect(result).toEqual([1000, 1300, 1600, 700]);
  });

  test('calculateUnitResearchDuration returns correct value', () => {
    const result = calculateUnitResearchDuration(mockUnitId);
    expect(result).toBe(14_080_000);
  });
});
