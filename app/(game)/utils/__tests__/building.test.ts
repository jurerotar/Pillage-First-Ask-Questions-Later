import {
  calculateBuildingCancellationRefundForLevel,
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  calculateBuildingEffectValues,
  calculatePopulationFromBuildingFields,
  calculateResourceProductionFromResourceFields,
  getBuildingData,
  getBuildingDataForLevel,
} from 'app/(game)/utils/building';
import { newVillageBuildingFieldsMock } from 'app/tests/mocks/game/village/building-fields-mock';
import {
  resourceFields00018Mock,
  resourceFields11115Mock,
  resourceFields4446Mock,
} from 'app/tests/mocks/game/village/resource-fields-mock';
import { describe, expect, test } from 'vitest';

describe('Building utils', () => {
  describe('calculatePopulationFromBuildingFields', () => {
    test('New village should have a population of 3', () => {
      expect(calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock, [])).toBe(3);
    });
  });

  describe('calculateBuildingEffectValues', () => {
    test('CITY_WALL effect values', () => {
      const building = getBuildingData('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 20);
      expect(result.find((e) => e.effectId === 'infantryDefence')!.currentLevelValue).toBe(200);
      expect(result.find((e) => e.effectId === 'infantryDefenceBonus')!.currentLevelValue).toBe(1.81);
      expect(result.find((e) => e.effectId === 'infantryDefence')!.nextLevelValue).toBe(0);
      expect(result.find((e) => e.effectId === 'infantryDefenceBonus')!.nextLevelValue).toBe(0);
    });

    test('BAKERY wheat production bonus', () => {
      const building = getBuildingData('BAKERY');
      const result = calculateBuildingEffectValues(building, 5);
      expect(result.find((e) => e.effectId === 'wheatProductionBonus')!.currentLevelValue).toBe(1.25);
    });

    test('CLAY_PIT clay production', () => {
      const building = getBuildingData('CLAY_PIT');
      const result = calculateBuildingEffectValues(building, 20);
      expect(result.find((e) => e.effectId === 'clayProduction')!.currentLevelValue).toBe(3430);
    });

    test('CITY_WALL values are increasing', () => {
      const building = getBuildingData('CITY_WALL');
      const result = calculateBuildingEffectValues(building, 10);
      expect(result.find((e) => e.effectId === 'infantryDefence')!.areEffectValuesRising).toBe(true);
    });

    test('BAKERY wheat production bonus values are increasing', () => {
      const building = getBuildingData('BAKERY');
      const result = calculateBuildingEffectValues(building, 3);
      expect(result.find((e) => e.effectId === 'wheatProductionBonus')!.areEffectValuesRising).toBe(true);
    });
  });

  describe('calculateResourceProductionFromResourceFields', () => {
    test('Village 4446 should have correct hourly resource production', () => {
      const village4446Production = calculateResourceProductionFromResourceFields(resourceFields4446Mock);
      expect(village4446Production).toMatchObject({ clayProduction: 12, ironProduction: 12, wheatProduction: 18, woodProduction: 12 });
    });

    test('Village 11115 should have correct hourly resource production', () => {
      const village11115Production = calculateResourceProductionFromResourceFields(resourceFields11115Mock);
      expect(village11115Production).toMatchObject({ clayProduction: 3, ironProduction: 3, wheatProduction: 45, woodProduction: 3 });
    });

    test('Village 00018 should have correct hourly resource production', () => {
      const village00018Production = calculateResourceProductionFromResourceFields(resourceFields00018Mock);
      expect(village00018Production).toMatchObject({ clayProduction: 0, ironProduction: 0, wheatProduction: 54, woodProduction: 0 });
    });
  });

  describe('getBuildingDataForLevel', () => {
    test('Main building level 1', () => {
      const { isMaxLevel, cumulativeCropConsumption, nextLevelCropConsumption, nextLevelResourceCost } = getBuildingDataForLevel(
        'MAIN_BUILDING',
        1,
      );
      expect(isMaxLevel).toBe(false);
      expect(cumulativeCropConsumption).toBe(2);
      expect(nextLevelCropConsumption).toBe(1);
      expect(nextLevelResourceCost).toEqual([90, 55, 80, 30]);
    });

    test('Main building level 20', () => {
      const { isMaxLevel, cumulativeCropConsumption, nextLevelCropConsumption, nextLevelResourceCost } = getBuildingDataForLevel(
        'MAIN_BUILDING',
        20,
      );
      expect(isMaxLevel).toBe(true);
      expect(cumulativeCropConsumption).toBe(41);
      expect(nextLevelCropConsumption).toBe(0);
      expect(nextLevelResourceCost).toEqual([0, 0, 0, 0]);
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
      const refund = calculateBuildingCancellationRefundForLevel('MAIN_BUILDING', 1);
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
