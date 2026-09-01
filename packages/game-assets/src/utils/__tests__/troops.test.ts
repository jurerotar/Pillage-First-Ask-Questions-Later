import { describe, expect, test } from 'vitest';
import {
  calculateLootableCarryCapacity,
  calculateTotalCarryCapacity,
  calculateTotalUnitWheatConsumption,
  distributeLoot,
} from '../troops';

describe(calculateTotalUnitWheatConsumption, () => {
  test('returns 0 for empty troop selection', () => {
    expect(calculateTotalUnitWheatConsumption([])).toBe(0);
  });

  test('sums wheat consumption across troop types', () => {
    expect(
      calculateTotalUnitWheatConsumption([
        { unitId: 'LEGIONNAIRE', amount: 10 },
        { unitId: 'EQUITES_CAESARIS', amount: 3 },
      ]),
    ).toBe(10 * 1 + 3 * 4);
  });

  test('includes hero wheat consumption', () => {
    expect(
      calculateTotalUnitWheatConsumption([
        { unitId: 'HERO', amount: 1 },
        { unitId: 'PRAETORIAN', amount: 5 },
      ]),
    ).toBe(5);
  });
});

describe(calculateTotalCarryCapacity, () => {
  test('returns 0 for empty troop selection', () => {
    expect(calculateTotalCarryCapacity([])).toBe(0);
  });

  test('sums carry capacity across troop types', () => {
    expect(
      calculateTotalCarryCapacity([
        { unitId: 'LEGIONNAIRE', amount: 10 },
        { unitId: 'EQUITES_IMPERATORIS', amount: 3 },
      ]),
    ).toBe(10 * 50 + 3 * 100);
  });

  test('includes units with no carry capacity', () => {
    expect(
      calculateTotalCarryCapacity([
        { unitId: 'ROMAN_RAM', amount: 5 },
        { unitId: 'ROMAN_CATAPULT', amount: 2 },
      ]),
    ).toBe(0);
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
    expect(distributeLoot([10, 20, 30, 40], 1_000)).toStrictEqual([
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
