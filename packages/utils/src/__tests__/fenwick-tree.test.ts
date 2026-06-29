import { describe, expect, test } from 'vitest';
import { FenwickTree } from '../fenwick-tree';

describe(FenwickTree, () => {
  test('calculates prefix sums and total', () => {
    const tree = new FenwickTree([1, 2, 3, 4]);

    expect(tree.sum(0)).toBe(1);
    expect(tree.sum(2)).toBe(6);
    expect(tree.total()).toBe(10);
  });

  test('updates values by index', () => {
    const tree = new FenwickTree([1, 2, 3]);

    tree.add(1, 5);

    expect(tree.sum(1)).toBe(8);
    expect(tree.total()).toBe(11);
  });

  test.each([
    [0, 0],
    [0.99, 0],
    [1, 1],
    [2.99, 1],
    [3, 2],
    [5.99, 2],
  ])('finds index for prefix value %s', (prefixValue, expectedIndex) => {
    const tree = new FenwickTree([1, 2, 3]);

    expect(tree.findByPrefix(prefixValue)).toBe(expectedIndex);
  });
});
