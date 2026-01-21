import { describe, expect, test } from 'vitest';
import { getHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';

describe('getHasEnoughResources', () => {
  test('returns true if current resources are all equal to or above the cost', () => {
    const currentResources = { wood: 500, clay: 600, iron: 700, wheat: 800 };
    const nextLevelCost = [400, 500, 600, 700];
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBeTruthy();
  });

  test('returns false if any current resource is below the cost', () => {
    const currentResources = { wood: 500, clay: 600, iron: 700, wheat: 800 };
    const nextLevelCost = [400, 500, 800, 700]; // iron not enough
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBeFalsy();
  });

  test('works when resources are exactly equal to the cost', () => {
    const currentResources = { wood: 400, clay: 500, iron: 600, wheat: 700 };
    const nextLevelCost = [400, 500, 600, 700];
    expect(getHasEnoughResources(nextLevelCost, currentResources)).toBeTruthy();
  });
});
