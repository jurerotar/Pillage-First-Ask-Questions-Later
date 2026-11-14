import { describe, expect, test } from 'vitest';
import {
  calculateTotalCarryCapacity,
  calculateTotalUnitWheatConsumption,
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
    ).toBe(10 + 3 * 4);
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
