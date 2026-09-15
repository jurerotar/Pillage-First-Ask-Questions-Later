import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineLootTable, rollLootTable } from '../loot-table';

const mockRandom = (rolls: number[]): void => {
  const remainingRolls = [...rolls];

  vi.spyOn(Math, 'random').mockImplementation(() => {
    return remainingRolls.shift() ?? 0;
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe(rollLootTable, () => {
  test('returns the result selected by the percentage roll', () => {
    mockRandom([0.3]);

    const result = rollLootTable(
      defineLootTable([
        { percentage: 25, result: { itemId: 1, amount: 1 } },
        { percentage: 50, result: { itemId: 2, amount: 1 } },
        { percentage: 25, result: { itemId: 3, amount: 1 } },
      ]),
    );

    expect(result).toStrictEqual({ itemId: 2, amount: 1 });
  });

  test('returns null when the roll lands outside the configured percentages', () => {
    mockRandom([0.9]);

    const result = rollLootTable(
      defineLootTable([
        { percentage: 25, result: { itemId: 1, amount: 1 } },
        { percentage: 25, result: { itemId: 2, amount: 1 } },
      ]),
    );

    expect(result).toBeNull();
  });

  test('supports nested loot tables', () => {
    mockRandom([0.6, 0.1]);

    const result = rollLootTable(
      defineLootTable([
        { percentage: 50, result: { itemId: 1, amount: 1 } },
        {
          percentage: 50,
          table: defineLootTable([
            { percentage: 25, result: { itemId: 2, amount: 1 } },
            { percentage: 75, result: { itemId: 3, amount: 1 } },
          ]),
        },
      ]),
    );

    expect(result).toStrictEqual({ itemId: 2, amount: 1 });
  });

  test('resolves item amount ranges to a concrete amount', () => {
    mockRandom([0.1, 0.5]);

    const result = rollLootTable(
      defineLootTable([
        {
          percentage: 100,
          result: {
            itemId: 1025,
            amount: [10, 20] as const,
          },
        },
      ]),
    );

    expect(result).toStrictEqual({
      itemId: 1025,
      amount: 15,
    });
  });

  test('resolves item amount ranges from nested loot tables', () => {
    mockRandom([0.6, 0.1, 0.999]);

    const result = rollLootTable(
      defineLootTable([
        { percentage: 50, result: { itemId: 1021, amount: 1 } },
        {
          percentage: 50,
          table: defineLootTable([
            {
              percentage: 100,
              result: {
                itemId: 1025,
                amount: [10, 20] as const,
              },
            },
          ]),
        },
      ]),
    );

    expect(result).toStrictEqual({
      itemId: 1025,
      amount: 20,
    });
  });
});
