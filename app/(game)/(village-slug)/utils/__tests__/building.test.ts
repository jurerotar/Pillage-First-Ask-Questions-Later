import {
  calculateBuildingCancellationRefundForLevel,
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  calculateBuildingEffectValues,
  calculatePopulationFromBuildingFields,
  getBuildingData,
  getBuildingDataForLevel,
} from 'app/(game)/(village-slug)/utils/building';
import { newVillageBuildingFieldsMock } from 'app/tests/mocks/game/village/building-fields-mock';
import { describe, expect, test } from 'vitest';

describe('Building utils', () => {
  describe('calculatePopulationFromBuildingFields', () => {
    test('New village should have a population of 3', () => {
      expect(
        calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock, []),
      ).toBe(3);
    });
  });

  describe('calculateBuildingEffectValues', () => {
    test('CITY_WALL effect values', () => {
      const building = getBuildingData('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.some(
          (e) =>
            e.effectId === 'infantryDefence' && e.currentLevelValue === 200,
        ),
      ).toBe(true);
    });

    test('BAKERY wheat production bonus', () => {
      const building = getBuildingData('BAKERY');
      const result = calculateBuildingEffectValues(building, 5);
      expect(
        result.some(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.25,
        ),
      ).toBe(true);
    });

    test('CLAY_PIT clay production', () => {
      const building = getBuildingData('CLAY_PIT');
      const result = calculateBuildingEffectValues(building, 20);
      expect(
        result.find((e) => e.effectId === 'clayProduction')!.currentLevelValue,
      ).toBe(3430);
    });

    test('CITY_WALL values are increasing', () => {
      const building = getBuildingData('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 10);
      expect(
        result.find((e) => e.effectId === 'infantryDefence')!
          .areEffectValuesRising,
      ).toBe(true);
    });

    test('BAKERY wheat production bonus values are increasing', () => {
      const building = getBuildingData('BAKERY');
      const result = calculateBuildingEffectValues(building, 3);
      expect(
        result.find(
          (e) =>
            e.effectId === 'wheatProduction' && e.currentLevelValue === 1.15,
        )!.areEffectValuesRising,
      ).toBe(true);
    });
  });

  describe('getBuildingDataForLevel', () => {
    test('Main building level 1', () => {
      const { isMaxLevel, nextLevelWheatConsumption, nextLevelResourceCost } =
        getBuildingDataForLevel('MAIN_BUILDING', 1);
      expect(isMaxLevel).toBe(false);
      expect(nextLevelWheatConsumption).toBe(3);
      expect(nextLevelResourceCost).toEqual([90, 55, 80, 30]);
    });

    test('Main building level 20', () => {
      const { isMaxLevel } = getBuildingDataForLevel('MAIN_BUILDING', 20);
      expect(isMaxLevel).toBe(true);
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
      expect(duration).toBe(2000000);
    });
  });
});
