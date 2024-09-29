import { type CalculateCurrentAmountArgs, calculateCurrentAmount } from 'app/[game]/hooks/use-calculated-resource';
import { villageMock } from 'mocks/game/village/village-mock';
import { describe, expect, test } from 'vitest';

describe('useCurrentResources', () => {
  describe('calculateCurrentAmount', () => {
    test('With production of 60/h, 60 resource units should be added in an hour', () => {
      const village = {
        ...villageMock,
        lastUpdatedAt: Date.now() - 3600 * 1000,
        resources: {
          ...villageMock.resources,
          wood: 700,
        },
      };

      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        village,
        resource: 'wood',
        storageCapacity: 800,
        hourlyProduction: 60,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(760);
    });

    test('With production of 0/h, 0 resource units should be added in an hour', () => {
      const village = {
        ...villageMock,
        lastUpdatedAt: Date.now() - 3600 * 1000,
        resources: {
          ...villageMock.resources,
          wood: 700,
        },
      };

      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        village,
        resource: 'wood',
        storageCapacity: 800,
        hourlyProduction: 0,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(700);
    });

    test('With a negative production of -60/h, 60 resource units should be lost in an hour', () => {
      const village = {
        ...villageMock,
        lastUpdatedAt: Date.now() - 3600 * 1000,
        resources: {
          ...villageMock.resources,
          wood: 700,
        },
      };

      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        village,
        resource: 'wood',
        storageCapacity: 800,
        hourlyProduction: -60,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(640);
    });

    test('New resources should not exceed storage capacity', () => {
      const village = {
        ...villageMock,
        lastUpdatedAt: Date.now() - 3600 * 1000,
        resources: {
          ...villageMock.resources,
          wood: 700,
        },
      };

      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        village,
        resource: 'wood',
        storageCapacity: 800,
        hourlyProduction: 200,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(800);
    });

    test('Resources should not go into negatives with negative production', () => {
      const village = {
        ...villageMock,
        lastUpdatedAt: Date.now() - 3600 * 1000,
        resources: {
          ...villageMock.resources,
          wood: 100,
        },
      };

      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        village,
        resource: 'wood',
        storageCapacity: 800,
        hourlyProduction: -200,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(0);
    });
  });
});
