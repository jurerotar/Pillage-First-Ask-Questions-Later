import { describe, expect, test } from 'vitest';
import {
  getHasEnoughResources,
  getResourcesReadyInHours,
} from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';

describe(getHasEnoughResources, () => {
  test('returns true if current resources are all equal to or above the cost', () => {
    const currentResources = { wood: 500, clay: 600, iron: 700, wheat: 800 };
    const nextLevelCost = [400, 500, 600, 700];
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBe(true);
  });

  test('returns false if any current resource is below the cost', () => {
    const currentResources = { wood: 500, clay: 600, iron: 700, wheat: 800 };
    const nextLevelCost = [400, 500, 800, 700]; // iron not enough
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBe(false);
  });

  test('works when resources are exactly equal to the cost', () => {
    const currentResources = { wood: 400, clay: 500, iron: 600, wheat: 700 };
    const nextLevelCost = [400, 500, 600, 700];
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBe(true);
  });
});

describe(getResourcesReadyInHours, () => {
  test('returns the longest wait time for missing resources', () => {
    expect(
      getResourcesReadyInHours({
        currentResources: { wood: 100, clay: 100, iron: 100, wheat: 100 },
        requiredResources: [200, 300, 100, 100],
        hourlyProductions: [100, 50, 25, 25],
      }),
    ).toBe(4);
  });

  test('returns null if any resource production is negative', () => {
    expect(
      getResourcesReadyInHours({
        currentResources: { wood: 100, clay: 100, iron: 100, wheat: 100 },
        requiredResources: [200, 100, 100, 100],
        hourlyProductions: [100, 50, 25, -1],
      }),
    ).toBeNull();
  });

  test('returns null if a missing resource cannot grow', () => {
    expect(
      getResourcesReadyInHours({
        currentResources: { wood: 100, clay: 100, iron: 100, wheat: 100 },
        requiredResources: [200, 100, 100, 100],
        hourlyProductions: [0, 50, 25, 25],
      }),
    ).toBeNull();
  });
});
