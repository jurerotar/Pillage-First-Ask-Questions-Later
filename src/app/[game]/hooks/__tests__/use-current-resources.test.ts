import { type CalculateCurrentAmountArgs, calculateCurrentAmount } from 'app/[game]/hooks/use-current-resources';
import { describe, expect, test } from 'vitest';

describe('useCurrentResources', () => {
  describe('calculateCurrentAmount', () => {
    test('With production of 60/h, 60 resource units should be added in an hour', () => {
      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        storageCapacity: 800,
        hourlyProduction: 60,
        resourceAmount: 700,
        lastUpdatedAt: Date.now() - 3600 * 1000,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(760);
    });

    test('With production of 0/h, 0 resource units should be added in an hour', () => {
      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        storageCapacity: 800,
        hourlyProduction: 0,
        resourceAmount: 700,
        lastUpdatedAt: Date.now() - 3600 * 1000,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(700);
    });

    test('With a negative production of -60/h, 60 resource units should be lost in an hour', () => {
      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        storageCapacity: 800,
        hourlyProduction: -60,
        resourceAmount: 700,
        lastUpdatedAt: Date.now() - 3600 * 1000,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(640);
    });

    test('New resources should not exceed storage capacity', () => {
      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        storageCapacity: 800,
        hourlyProduction: 200,
        resourceAmount: 700,
        lastUpdatedAt: Date.now() - 3600 * 1000,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(800);
    });

    test('Resources should not go into negatives with negative production', () => {
      const calculateCurrentAmountArgs: CalculateCurrentAmountArgs = {
        storageCapacity: 800,
        hourlyProduction: -200,
        resourceAmount: 100,
        lastUpdatedAt: Date.now() - 3600 * 1000,
      };

      const { currentAmount } = calculateCurrentAmount(calculateCurrentAmountArgs);

      expect(currentAmount).toBe(0);
    });
  });
});
