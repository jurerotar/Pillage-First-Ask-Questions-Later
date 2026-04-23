import { describe, expect, test } from 'vitest';
import {
  calculateBuildingCancellationRefundForLevel,
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  calculateBuildingEffectValues,
  calculateTotalCulturePointsForLevel,
  calculateTotalPopulationForLevel,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '../buildings';

describe('buildings utils', () => {
  describe(calculateBuildingEffectValues, () => {
    test('romal wall effect values', () => {
      const building = getBuildingDefinition('ROMAN_WALL');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.some(
          (e) =>
            e.effectId === 'infantryDefence' && e.currentLevelValue === 200,
        ),
      ).toBe(true);
    });

    test('bakery wheat production bonus', () => {
      const building = getBuildingDefinition('BAKERY');
      const result = calculateBuildingEffectValues(building, 5);
      expect(
        result.some(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.25,
        ),
      ).toBe(true);
    });

    test('clay pit clay production', () => {
      const building = getBuildingDefinition('CLAY_PIT');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.find((e) => e.effectId === 'clayProduction')!.currentLevelValue,
      ).toBe(3430);
    });

    test('roman wall values are increasing', () => {
      const building = getBuildingDefinition('ROMAN_WALL');
      const result = calculateBuildingEffectValues(building, 10);
      expect(
        result.find((e) => e.effectId === 'infantryDefence')!
          .areEffectValuesRising,
      ).toBe(true);
    });

    test('bakery wheat production bonus values are increasing', () => {
      const building = getBuildingDefinition('BAKERY');
      const result = calculateBuildingEffectValues(building, 3);
      expect(
        result.find(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.15,
        )!.areEffectValuesRising,
      ).toBe(true);
    });
  });

  describe(getBuildingDataForLevel, () => {
    test('main building level 1', () => {
      const { isMaxLevel, nextLevelPopulation, nextLevelResourceCost } =
        getBuildingDataForLevel('MAIN_BUILDING', 1);
      expect(isMaxLevel).toBe(false);
      expect(nextLevelPopulation).toBe(3);
      expect(nextLevelResourceCost).toStrictEqual([90, 55, 80, 30]);
    });

    test('main building level 20', () => {
      const { isMaxLevel } = getBuildingDataForLevel('MAIN_BUILDING', 20);
      expect(isMaxLevel).toBe(true);
    });
  });

  describe(calculateBuildingCostForLevel, () => {
    test('should calculate correct building cost', () => {
      const cost = calculateBuildingCostForLevel('MAIN_BUILDING', 1);
      expect(cost).toStrictEqual([70, 40, 60, 20]);
    });
  });

  describe(calculateBuildingCancellationRefundForLevel, () => {
    test('should calculate 95% refund for <= 5% completion', () => {
      const refundAt0 = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
        0,
      );
      // Cost is [70, 40, 60, 20]. 95% is [66.5, 38, 57, 19]. trunc -> [66, 38, 57, 19]
      expect(refundAt0).toStrictEqual([66, 38, 57, 19]);

      const refundAt5 = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
        0.05,
      );
      expect(refundAt5).toStrictEqual([66, 38, 57, 19]);
    });

    test('should calculate proportional refund for > 5% completion', () => {
      // At 50% completion:
      // refundPercentage = 0.95 - (0.5 - 0.05) / (1 - 0.05)
      // refundPercentage = 0.95 - 0.45 / 0.95 = 0.95 - 0.47368 = 0.47632
      const refundAt50 = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
        0.5,
      );
      // 70 * 0.47632 = 33.34 -> 33
      // 40 * 0.47632 = 19.05 -> 19
      // 60 * 0.47632 = 28.57 -> 28
      // 20 * 0.47632 = 9.52 -> 9
      expect(refundAt50).toStrictEqual([33, 19, 28, 9]);
    });

    test('should cap refund at 40%', () => {
      const refundAt99 = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
        0.99,
      );
      // 70 * 0.4 = 28
      // 40 * 0.4 = 16
      // 60 * 0.4 = 24
      // 20 * 0.4 = 8
      expect(refundAt99).toStrictEqual([28, 16, 24, 8]);

      const refundAt100 = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
        1,
      );
      expect(refundAt100).toStrictEqual([28, 16, 24, 8]);
    });
  });

  describe(calculateBuildingDurationForLevel, () => {
    test('should calculate correct duration for level 1', () => {
      const duration = calculateBuildingDurationForLevel('MAIN_BUILDING', 1);
      expect(duration).toBe(2_000_000);
    });
  });

  describe(calculateTotalCulturePointsForLevel, () => {
    test('main building produces X culture points at level 0', () => {
      const totalCulturePoints = calculateTotalCulturePointsForLevel(
        'MAIN_BUILDING',
        0,
      );

      expect(totalCulturePoints).toBe(0);
    });

    test('main building produces X culture points at level 20', () => {
      const totalCulturePoints = calculateTotalCulturePointsForLevel(
        'MAIN_BUILDING',
        20,
      );

      expect(totalCulturePoints).toBe(77);
    });
  });

  describe(calculateTotalPopulationForLevel, () => {
    test('main building produces X population at level 0', () => {
      const totalPopulation = calculateTotalPopulationForLevel(
        'MAIN_BUILDING',
        0,
      );

      expect(totalPopulation).toBe(0);
    });

    test('main building produces X population at level 20', () => {
      const totalPopulation = calculateTotalPopulationForLevel(
        'MAIN_BUILDING',
        20,
      );

      expect(totalPopulation).toBe(41);
    });
  });
});
