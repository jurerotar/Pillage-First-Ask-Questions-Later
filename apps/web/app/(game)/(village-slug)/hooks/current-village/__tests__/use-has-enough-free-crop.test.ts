import { describe, expect, test } from 'vitest';
import { getHasEnoughFreeCrop } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-free-crop';

describe(getHasEnoughFreeCrop, () => {
  test('returns true if nextLevelWheatConsumption is 0', () => {
    expect(getHasEnoughFreeCrop('MAIN_BUILDING', 0, 100)).toBe(true);
  });

  test('returns true if there is enough free crop', () => {
    expect(getHasEnoughFreeCrop('MAIN_BUILDING', 10, 100)).toBe(true);
  });

  test('returns false if there is not enough free crop', () => {
    expect(getHasEnoughFreeCrop('MAIN_BUILDING', 20, 10)).toBe(false);
  });

  test('returns true for wheat fields even if there is not enough free crop', () => {
    expect(getHasEnoughFreeCrop('WHEAT_FIELD', 20, -100)).toBe(true);
  });
});
