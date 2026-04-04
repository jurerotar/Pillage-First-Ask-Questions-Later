import { describe, expect, test } from 'vitest';
import {
  unitSpeedAfter20FieldsHeroBonusEffectMock,
  unitSpeedAfter20FieldsHugeHeroBonusEffectMock,
  unitSpeedHeroBonusEffectMock,
} from '@pillage-first/mocks/effect';
import { villageMock } from '@pillage-first/mocks/village';
import type { Effect } from '@pillage-first/types/models/effect';
import type { Troop } from '@pillage-first/types/models/troop';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';

describe('calculateTravelDuration', () => {
  const defaultArgs = {
    originVillageId: villageMock.id,
    originCoordinates: { x: 0, y: 0 },
    targetCoordinates: { x: 10, y: 0 },
    // LEGIONNAIRE speed is 6
    troops: [
      { unitId: 'LEGIONNAIRE', amount: 10, source: 1, tileId: 1 },
    ] satisfies Troop[],
    effects: [] satisfies Effect[],
  };

  test('should calculate duration correctly for distance <= 20 with no bonuses', () => {
    // distance = 10, speed = 6, bonus = 1 => computedSpeed = 6
    // distance / computedSpeed = 10 / 6 hours
    // (10 / 6) * 3,600,000 = 6,000,000 ms
    const duration = calculateTravelDuration(defaultArgs);

    expect(duration).toBe(6_000_000);
  });

  test('should apply unitSpeed bonus for distance <= 20', () => {
    // distance = 10, speed = 6
    // bonus = 2 (200% speed) => computedSpeed = 12
    // distance / computedSpeed = 10 / 12 = 0.8333 hours
    // (10 / 12) * 3,600,000 = 3,000,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      effects: [unitSpeedHeroBonusEffectMock],
    });

    expect(duration).toBe(3_000_000);
  });

  test('should use the slowest unit speed', () => {
    // LEGIONNAIRE speed = 6
    // PRAETORIAN speed = 5
    // slowest = 5
    // distance = 10
    // 10 / 5 = 2 hours = 7,200,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      troops: [
        { unitId: 'LEGIONNAIRE', amount: 10, source: 1, tileId: 1 },
        { unitId: 'PRAETORIAN', amount: 10, source: 1, tileId: 1 },
      ],
    });

    expect(duration).toBe(7_200_000);
  });

  test('should calculate duration correctly for distance > 20 with no bonuses', () => {
    // target at (30, 0) => distance = 30
    // speed = 6
    // timeToCross20Fields = 20 / 6 hours
    // remainingDistance = 10
    // timeToCrossRemaining = 10 / 6 hours
    // total = 30 / 6 = 5 hours = 18,000,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetCoordinates: { x: 30, y: 0 },
    });

    expect(duration).toBe(18_000_000);
  });

  test('should apply unitSpeedAfter20Fields bonus for distance > 20', () => {
    // distance = 30, speed = 6
    // timeToCross20Fields = 20 / 6 = 3.333 hours = 12,000,000 ms
    // remainingDistance = 10
    // bonusAfter20 = 2 (200% speed) => speed = 12
    // timeToCrossRemaining = 10 / 12 = 0.8333 hours = 3,000,000 ms
    // total = 15,000,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetCoordinates: { x: 30, y: 0 },
      effects: [unitSpeedAfter20FieldsHeroBonusEffectMock],
    });

    expect(duration).toBeCloseTo(15_000_000);
  });

  test('should calculate duration correctly for distance === 20 (boundary condition)', () => {
    // distance = 20, speed = 6
    // 20 / 6 hours = 12,000,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetCoordinates: { x: 20, y: 0 },
    });

    expect(duration).toBe(12_000_000);
  });

  test('should apply unitSpeedAfter20Fields bonus for distance === 21', () => {
    // distance = 21, speed = 6
    // timeToCross20Fields = 20 / 6 = 3.333 hours = 12,000,000 ms
    // remainingDistance = 1
    // bonusAfter20 = 10 (1000% speed) => speed = 60
    // timeToCrossRemaining = 1 / 60 hours = 60,000 ms
    // total = 12,060,000 ms
    const duration = calculateTravelDuration({
      ...defaultArgs,
      targetCoordinates: { x: 21, y: 0 },
      effects: [unitSpeedAfter20FieldsHugeHeroBonusEffectMock],
    });

    expect(duration).toBeCloseTo(12_060_000);
  });
});
