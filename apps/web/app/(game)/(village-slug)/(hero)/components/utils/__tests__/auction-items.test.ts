import { describe, expect, test } from 'vitest';
import { getAuctionWearableOwnershipStatus } from '../auction-items';

describe(getAuctionWearableOwnershipStatus, () => {
  test('returns null for non-wearable items', () => {
    expect(getAuctionWearableOwnershipStatus(1021, [{ id: 1021 }], [])).toBe(
      null,
    );
  });

  test('identifies wearable items already owned in inventory', () => {
    expect(
      getAuctionWearableOwnershipStatus(104_001, [{ id: 104_001 }], []),
    ).toBe('owned');
  });

  test('identifies wearable items already equipped', () => {
    expect(
      getAuctionWearableOwnershipStatus(104_001, [], [{ itemId: 104_001 }]),
    ).toBe('equipped');
  });

  test('identifies better wearable items already owned in inventory', () => {
    expect(
      getAuctionWearableOwnershipStatus(104_001, [{ id: 104_003 }], []),
    ).toBe('better-owned');
  });

  test('identifies better wearable items already equipped', () => {
    expect(
      getAuctionWearableOwnershipStatus(104_001, [], [{ itemId: 104_003 }]),
    ).toBe('better-equipped');
  });
});
