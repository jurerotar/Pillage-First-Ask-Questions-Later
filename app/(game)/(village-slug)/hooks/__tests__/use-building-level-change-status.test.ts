import { describe, expect, test } from 'vitest';
import {
  getHasEnoughFreeCrop,
  getHasEnoughGranaryCapacity,
  getHasEnoughResources,
  getHasEnoughWarehouseCapacity,
} from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';

describe('getHasEnoughFreeCrop', () => {
  test('returns true if nextLevelWheatConsumption is 0', () => {
    expect(getHasEnoughFreeCrop(0, 100)).toBeTruthy();
  });

  test('returns true if there is enough free crop', () => {
    expect(getHasEnoughFreeCrop(10, 100)).toBeTruthy();
  });

  test('returns false if there is not enough free crop', () => {
    expect(getHasEnoughFreeCrop(20, 10)).toBeFalsy();
  });
});

describe('getHasEnoughWarehouseCapacity', () => {
  test('returns true if all first 3 resource costs are below or equal to capacity', () => {
    expect(
      getHasEnoughWarehouseCapacity(800, [500, 600, 700, 200]),
    ).toBeTruthy();
  });

  test('returns false if any of the first 3 resource costs exceed capacity', () => {
    expect(getHasEnoughWarehouseCapacity(600, [700, 600, 500])).toBeFalsy();
    expect(getHasEnoughWarehouseCapacity(600, [500, 700, 500])).toBeFalsy();
    expect(getHasEnoughWarehouseCapacity(600, [500, 600, 700])).toBeFalsy();
  });

  test('ignores the 4th value (wheat)', () => {
    expect(
      getHasEnoughWarehouseCapacity(600, [500, 600, 500, 9999]),
    ).toBeTruthy();
  });
});

describe('getHasEnoughGranaryCapacity', () => {
  test('returns true if granary capacity is equal to or greater than wheat cost', () => {
    expect(getHasEnoughGranaryCapacity(300, 300)).toBeTruthy();
    expect(getHasEnoughGranaryCapacity(400, 300)).toBeTruthy();
  });

  test('returns false if granary capacity is less than wheat cost', () => {
    expect(getHasEnoughGranaryCapacity(200, 300)).toBeFalsy();
  });
});

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
