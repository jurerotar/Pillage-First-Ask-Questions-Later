import {
  calculatePopulationFromBuildingFields,
  calculateResourceProductionFromResourceFields,
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

  // TODO: Add assertions for effects
  describe('getBuildingDataForLevel', () => {
    test('Main building level 1', () => {
      const { isMaxLevel, cumulativeCropConsumption, nextLevelCropConsumption, nextLevelResourceCost } = getBuildingDataForLevel(
        'MAIN_BUILDING',
        1,
      );
      expect.soft(isMaxLevel, 'isMaxLevel should be false').toBe(false);
      expect.soft(cumulativeCropConsumption, 'cumulativeCropConsumption should be 2').toBe(2);
      expect.soft(nextLevelCropConsumption, 'nextLevelCropConsumption should be 2').toBe(1);
      expect.soft(nextLevelResourceCost, 'nextLevelResourceCost should be correct amount').toEqual([115, 70, 100, 35]);
    });

    test('Main building level 20', () => {
      const { isMaxLevel, cumulativeCropConsumption, nextLevelCropConsumption, nextLevelResourceCost } = getBuildingDataForLevel(
        'MAIN_BUILDING',
        20,
      );
      expect.soft(isMaxLevel, 'isMaxLevel should be true').toBe(true);
      expect.soft(cumulativeCropConsumption, 'cumulativeCropConsumption should be 2').toBe(41);
      expect.soft(nextLevelCropConsumption, 'nextLevelCropConsumption should be 2').toBe(0);
      expect.soft(nextLevelResourceCost, 'nextLevelResourceCost should be 0').toEqual([0, 0, 0, 0]);
    });
  });
});
