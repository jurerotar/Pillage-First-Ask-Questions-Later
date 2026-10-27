import { describe, expect, test } from 'vitest';
import { calculateStorageLimitAt } from '../calculate-storage-limit-at';

describe(calculateStorageLimitAt, () => {
  const lastUpdatedAt = 1_700_000_000_000;
  const oneHour = 3_600_000;

  test('fills storage with positive production', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 200,
      lastUpdatedAt,
      hourlyProduction: 100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 8 * oneHour);
  });

  test('depletes storage with negative production', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 200,
      lastUpdatedAt,
      hourlyProduction: -100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 2 * oneHour);
  });

  test('fills empty storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 0,
      lastUpdatedAt,
      hourlyProduction: 100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 10 * oneHour);
  });

  test('depletes full storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 1000,
      lastUpdatedAt,
      hourlyProduction: -100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 10 * oneHour);
  });

  test('returns null for full storage with positive production', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 1000,
      lastUpdatedAt,
      hourlyProduction: 100,
      storageCapacity: 1000,
    });

    expect(result).toBeNull();
  });

  test('returns the saved timestamp for depleted storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 0,
      lastUpdatedAt,
      hourlyProduction: -100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt);
  });

  test('returns null for overfull storage with positive production', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 1200,
      lastUpdatedAt,
      hourlyProduction: 100,
      storageCapacity: 1000,
    });

    expect(result).toBeNull();
  });

  test('uses fractional positive production without truncation', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 999,
      lastUpdatedAt,
      hourlyProduction: 0.5,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 2 * oneHour);
  });

  test('uses fractional negative production without truncation', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 1,
      lastUpdatedAt,
      hourlyProduction: -0.5,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 2 * oneHour);
  });

  test('supports durations shorter than an hour', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 950,
      lastUpdatedAt,
      hourlyProduction: 100,
      storageCapacity: 1000,
    });

    expect(result).toBe(lastUpdatedAt + 0.5 * oneHour);
  });

  test('returns null for zero production with empty storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 0,
      lastUpdatedAt,
      hourlyProduction: 0,
      storageCapacity: 1000,
    });

    expect(result).toBeNull();
  });

  test('returns null for zero production with partially filled storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 200,
      lastUpdatedAt,
      hourlyProduction: 0,
      storageCapacity: 1000,
    });

    expect(result).toBeNull();
  });

  test('returns null for zero production with full storage', () => {
    const result = calculateStorageLimitAt({
      lastKnownResourceAmount: 1000,
      lastUpdatedAt,
      hourlyProduction: 0,
      storageCapacity: 1000,
    });

    expect(result).toBeNull();
  });
});
