import { describe, expect, test } from 'vitest';
import { calculateLoyaltyIncreaseEventDuration } from '../loyalty';

describe(calculateLoyaltyIncreaseEventDuration, () => {
  test('should return 60 minutes for 1x speed', () => {
    expect(calculateLoyaltyIncreaseEventDuration(1)).toBe(60 * 60 * 1000);
  });

  test('should return 30 minutes for 2x speed', () => {
    expect(calculateLoyaltyIncreaseEventDuration(2)).toBe(30 * 60 * 1000);
  });

  test('should return 20 minutes for 3x speed', () => {
    expect(calculateLoyaltyIncreaseEventDuration(3)).toBe(20 * 60 * 1000);
  });
});
