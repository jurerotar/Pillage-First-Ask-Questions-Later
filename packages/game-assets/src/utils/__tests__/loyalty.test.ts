import { expect, test } from 'vitest';
import {
  calculateLoyaltyIncreaseInterval,
  getLoyaltyAt,
  getNextLoyaltyIncreaseAt,
} from '../loyalty';

test.each([
  [1, 60],
  [2, 30],
  [3, 20],
  [5, 12],
  [10, 6],
] as const)(
  'at %ix speed, loyalty ticks every %i minutes',
  (speed, minutes) => {
    expect(calculateLoyaltyIncreaseInterval(speed)).toBe(minutes * 60 * 1000);
  },
);

test('the next tick stays aligned to server creation and is strictly in the future', () => {
  expect(getNextLoyaltyIncreaseAt(100, 1000, 1099)).toBe(1100);
  expect(getNextLoyaltyIncreaseAt(100, 1000, 1100)).toBe(2100);
});

test('the countdown advances with loyalty and stops at 100', () => {
  const snapshot = {
    loyalty: 91,
    nextLoyaltyIncreaseAt: 1100,
    loyaltyIncreaseInterval: 1000,
    loyaltyIncreaseAmount: 3,
  };

  expect(getLoyaltyAt(snapshot, 1099)).toBe(snapshot);
  expect(getLoyaltyAt(snapshot, 1100)).toMatchObject({
    loyalty: 94,
    nextLoyaltyIncreaseAt: 2100,
  });
  expect(getLoyaltyAt(snapshot, 2100)).toMatchObject({
    loyalty: 97,
    nextLoyaltyIncreaseAt: 3100,
  });
  expect(getLoyaltyAt(snapshot, 3100)).toMatchObject({
    loyalty: 100,
    nextLoyaltyIncreaseAt: null,
  });
});
