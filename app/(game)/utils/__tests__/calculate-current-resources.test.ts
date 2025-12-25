import { describe, expect, test } from 'vitest';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';
import type { Village } from 'app/interfaces/models/game/village';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';

describe('calculateCurrentAmount', () => {
  const oneHour = 3_600_000; // ms
  const baseTime = Date.now();
  const storageCapacity = 1000;

  const getMockVillage = (
    override: Partial<typeof villageMock> = {},
  ): Village => ({
    ...villageMock,
    lastUpdatedAt: baseTime,
    ...override,
  });

  test('produces correct amount after 1 hour at +60/hr (1 per minute)', () => {
    const village = getMockVillage();
    const timestamp = baseTime + oneHour;

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: 60,
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(810); // 750 + 60
    expect(result.timeSinceLastUpdateInSeconds).toBe(3600);
    expect(result.secondsForResourceGeneration).toBe(60);
  });

  test('caps amount at storageCapacity', () => {
    const village = getMockVillage({
      resources: { ...villageMock.resources, wood: 990 },
    });
    const timestamp = baseTime + oneHour;

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: 60,
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(1000); // capped
  });

  test('decreases correctly with negative production (-60/hr)', () => {
    const village = getMockVillage();
    const timestamp = baseTime + oneHour;

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: -60,
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(690); // 750 - 60
  });

  test('never goes below 0 with negative production', () => {
    const village = getMockVillage({
      resources: { ...villageMock.resources, wood: 10 },
    });
    const timestamp = baseTime + 5 * oneHour; // try to subtract 300

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: -60,
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(0);
  });

  test('no production results in unchanged resource amount', () => {
    const village = getMockVillage();
    const timestamp = baseTime + oneHour;

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: 0,
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(750); // unchanged
    expect(result.secondsForResourceGeneration).toBe(Number.POSITIVE_INFINITY);
  });

  test('partial interval does not add resource until full cycle', () => {
    const village = getMockVillage();
    const timestamp = baseTime + 30 * 1000; // 30 seconds later

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: 60, // 1 per minute
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(750); // not enough time to generate
  });

  test('calculates lastEffectiveUpdate accurately', () => {
    const village = getMockVillage();
    const timestamp = baseTime + 125 * 1000; // 125 seconds later

    const result = calculateCurrentAmount({
      lastKnownResourceAmount: village.resources.wood,
      lastUpdatedAt: village.lastUpdatedAt,
      hourlyProduction: 60, // 1 per minute
      storageCapacity,
      timestamp,
    });

    expect(result.currentAmount).toBe(752); // 2 units added
    const expectedLastEffectiveUpdate = baseTime + 120 * 1000;
    expect(result.lastEffectiveUpdate).toBe(expectedLastEffectiveUpdate);
  });
});
