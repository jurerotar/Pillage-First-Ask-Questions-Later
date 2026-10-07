import { describe, expect, test } from 'vitest';
import { getScheduledBuildingConstructionResourceChecks } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';

describe(getScheduledBuildingConstructionResourceChecks, () => {
  test('only ignores currently missing resources when scheduling', () => {
    expect(
      getScheduledBuildingConstructionResourceChecks({
        hasEnoughGranaryCapacity: false,
        hasEnoughResources: false,
        hasEnoughWarehouseCapacity: false,
        isScheduling: true,
      }),
    ).toEqual({
      hasEnoughGranaryCapacity: false,
      hasEnoughResources: true,
      hasEnoughWarehouseCapacity: false,
    });
  });

  test('keeps resource checks unchanged outside scheduling', () => {
    expect(
      getScheduledBuildingConstructionResourceChecks({
        hasEnoughGranaryCapacity: true,
        hasEnoughResources: false,
        hasEnoughWarehouseCapacity: true,
        isScheduling: false,
      }),
    ).toEqual({
      hasEnoughGranaryCapacity: true,
      hasEnoughResources: false,
      hasEnoughWarehouseCapacity: true,
    });
  });
});
