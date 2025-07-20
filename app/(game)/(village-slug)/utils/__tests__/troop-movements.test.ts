import { describe, expect, test, vi } from 'vitest';
import { calculateTravelDuration } from 'app/(game)/(village-slug)/utils/troop-movements';
import * as effectUtils from 'app/(game)/utils/calculate-computed-effect';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { ComputedEffectReturn } from 'app/(game)/utils/calculate-computed-effect';

describe('calculateTravelDuration', () => {
  const mockVillageId = 0x00010001; // (1, 1)
  const mockTargetIdNear = 0x00020002; // (2, 2) ≈ 1.41 distance
  const mockTargetIdFar = 0x00190001; // (25, 1) ≈ 24 distance

  test('returns correct duration when distance is ≤ 20', () => {
    const troops: Troop[] = [
      {
        unitId: 'LEGIONNAIRE',
        tileId: mockVillageId,
        source: mockVillageId,
        amount: 1,
      },
    ];

    using _ = vi
      .spyOn(effectUtils, 'calculateComputedEffect')
      .mockReturnValueOnce({ total: 1.2 } as ComputedEffectReturn);

    const duration = calculateTravelDuration({
      villageId: mockVillageId,
      targetId: mockTargetIdNear,
      troops,
      effects: [],
    });

    const expectedDistance = Math.sqrt(1 ** 2 + 1 ** 2); // ≈ 1.41
    const slowestSpeed = 6;
    const speedWithBonus = slowestSpeed * 1.2; // 6
    const expectedTimeMs = (expectedDistance / speedWithBonus) * 3_600_000;

    expect(duration).toBeCloseTo(expectedTimeMs, 5);
  });

  test('returns correct duration when distance is > 20 with separate speed bonus after 20 fields', () => {
    const troops: Troop[] = [
      {
        unitId: 'LEGIONNAIRE',
        tileId: mockVillageId,
        source: mockVillageId,
        amount: 1,
      },
    ];

    using _ = vi
      .spyOn(effectUtils, 'calculateComputedEffect')
      .mockReturnValueOnce({ total: 1.5 } as ComputedEffectReturn) // unitSpeed bonus
      .mockReturnValueOnce({ total: 2 } as ComputedEffectReturn); // unitSpeedAfter20Fields bonus

    const duration = calculateTravelDuration({
      villageId: mockVillageId,
      targetId: mockTargetIdFar,
      troops,
      effects: [],
    });

    const slowestSpeed = 6;
    const computedSpeed = slowestSpeed * 1.5; // 7.5
    const firstSegmentTime = 20 / computedSpeed;
    const secondSegmentTime = 4 / (computedSpeed * 2); // Remaining distance with post-20 bonus

    const expectedTimeMs = (firstSegmentTime + secondSegmentTime) * 3_600_000;
    expect(duration).toBeCloseTo(expectedTimeMs, 5);
  });

  test('ignores unitSpeedAfter20Fields bonus when distance is ≤ 20', () => {
    const troops: Troop[] = [
      {
        unitId: 'LEGIONNAIRE',
        tileId: mockVillageId,
        source: mockVillageId,
        amount: 1,
      },
    ];

    using _ = vi
      .spyOn(effectUtils, 'calculateComputedEffect')
      .mockReturnValueOnce({ total: 1.1 } as ComputedEffectReturn) // unitSpeed bonus
      .mockReturnValueOnce({ total: 2 } as ComputedEffectReturn); // should be ignored

    const duration = calculateTravelDuration({
      villageId: mockVillageId,
      targetId: mockTargetIdNear, // ≈ distance 1.41
      troops,
      effects: [],
    });

    const distance = Math.sqrt(1 ** 2 + 1 ** 2); // ≈ 1.41
    const slowestSpeed = 6;
    const computedSpeed = slowestSpeed * 1.1; // 5.5

    const expectedTimeMs = (distance / computedSpeed) * 3_600_000;

    expect(duration).toBeCloseTo(expectedTimeMs, 5);
  });
});
