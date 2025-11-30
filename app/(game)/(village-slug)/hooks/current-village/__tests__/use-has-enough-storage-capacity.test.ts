import { describe, expect, test } from 'vitest';
import {
  getHasEnoughGranaryCapacity,
  getHasEnoughWarehouseCapacity,
} from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity';

describe('getHasEnoughWarehouseCapacity', () => {
  test('returns true if all first 3 resource costs are below or equal to capacity', () => {
    expect(getHasEnoughWarehouseCapacity(800, [500, 600, 700, 200])).toBe(true);
  });

  test('returns false if any of the first 3 resource costs exceed capacity', () => {
    expect(getHasEnoughWarehouseCapacity(600, [700, 600, 500])).toBe(false);
    expect(getHasEnoughWarehouseCapacity(600, [500, 700, 500])).toBe(false);
    expect(getHasEnoughWarehouseCapacity(600, [500, 600, 700])).toBe(false);
  });

  test('ignores the 4th value (wheat)', () => {
    expect(getHasEnoughWarehouseCapacity(600, [500, 600, 500, 9999])).toBe(
      true,
    );
  });
});

describe('getHasEnoughGranaryCapacity', () => {
  test('returns true if granary capacity is equal to or greater than wheat cost', () => {
    expect(getHasEnoughGranaryCapacity(300, 300)).toBe(true);
    expect(getHasEnoughGranaryCapacity(400, 300)).toBe(true);
  });

  test('returns false if granary capacity is less than wheat cost', () => {
    expect(getHasEnoughGranaryCapacity(200, 300)).toBe(false);
  });
});
