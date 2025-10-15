import {
  calculateBuildingCancellationRefundForLevel,
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  calculateBuildingEffectValues,
  calculateTotalCulturePointsForLevel,
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
  getBuildingDataForLevel,
} from 'app/assets/utils/buildings';
import { describe, expect, test } from 'vitest';

describe('Buildings utils', () => {
  describe('calculateBuildingEffectValues', () => {
    test('CITY_WALL effect values', () => {
      const building = getBuildingDefinition('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.some(
          (e) =>
            e.effectId === 'infantryDefence' && e.currentLevelValue === 200,
        ),
      ).toBeTruthy();
    });

    test('BAKERY wheat production bonus', () => {
      const building = getBuildingDefinition('BAKERY');
      const result = calculateBuildingEffectValues(building, 5);
      expect(
        result.some(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.25,
        ),
      ).toBeTruthy();
    });

    test('CLAY_PIT clay production', () => {
      const building = getBuildingDefinition('CLAY_PIT');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.find((e) => e.effectId === 'clayProduction')!.currentLevelValue,
      ).toBe(3430);
    });

    test('CITY_WALL values are increasing', () => {
      const building = getBuildingDefinition('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 10);
      expect(
        result.find((e) => e.effectId === 'infantryDefence')!
          .areEffectValuesRising,
      ).toBeTruthy();
    });

    test('BAKERY wheat production bonus values are increasing', () => {
      const building = getBuildingDefinition('BAKERY');
      const result = calculateBuildingEffectValues(building, 3);
      expect(
        result.find(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.15,
        )!.areEffectValuesRising,
      ).toBeTruthy();
    });
  });

  describe('getBuildingDataForLevel', () => {
    test('Main building level 1', () => {
      const { isMaxLevel, nextLevelPopulation, nextLevelResourceCost } =
        getBuildingDataForLevel('MAIN_BUILDING', 1);
      expect(isMaxLevel).toBeFalsy();
      expect(nextLevelPopulation).toBe(3);
      expect(nextLevelResourceCost).toEqual([90, 55, 80, 30]);
    });

    test('Main building level 20', () => {
      const { isMaxLevel } = getBuildingDataForLevel('MAIN_BUILDING', 20);
      expect(isMaxLevel).toBeTruthy();
    });
  });

  describe('calculateBuildingCostForLevel', () => {
    test('Should calculate correct building cost', () => {
      const cost = calculateBuildingCostForLevel('MAIN_BUILDING', 1);
      expect(cost).toEqual([70, 40, 60, 20]);
    });
  });

  describe('calculateBuildingCancellationRefundForLevel', () => {
    test('Should calculate correct refund amount', () => {
      const refund = calculateBuildingCancellationRefundForLevel(
        'MAIN_BUILDING',
        1,
      );
      expect(refund).toEqual([56, 32, 48, 16]);
    });
  });

  describe('calculateBuildingDurationForLevel', () => {
    test('Should calculate correct duration for level 1', () => {
      const duration = calculateBuildingDurationForLevel('MAIN_BUILDING', 1);
      expect(duration).toBe(2_000_000);
    });
  });

  describe('calculateTotalCulturePointsForLevel', () => {
    test('MAIN_BUILDING produces X culture points at level 0', () => {
      const totalCulturePoints = calculateTotalCulturePointsForLevel(
        'MAIN_BUILDING',
        0,
      );

      expect(totalCulturePoints).toBe(0);
    });

    test('MAIN_BUILDING produces X culture points at level 20', () => {
      const totalCulturePoints = calculateTotalCulturePointsForLevel(
        'MAIN_BUILDING',
        20,
      );

      expect(totalCulturePoints).toBe(77);
    });
  });

  describe('calculateTotalPopulationForLevel', () => {
    test('MAIN_BUILDING produces X population at level 20', () => {
      const totalPopulation = calculateTotalPopulationForLevel(
        'MAIN_BUILDING',
        0,
      );

      expect(totalPopulation).toBe(0);
    });

    test('MAIN_BUILDING produces X population at level 20', () => {
      const totalPopulation = calculateTotalPopulationForLevel(
        'MAIN_BUILDING',
        20,
      );

      expect(totalPopulation).toBe(41);
    });
  });
});
