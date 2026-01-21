import { describe, expect, test } from 'vitest';
import { partition } from '../array';

describe('array utils', () => {
  describe('partition', () => {
    test('should partition an array based on a predicate', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const isEven = (n: number) => n % 2 === 0;
      const [even, odd] = partition(array, isEven);

      expect(even).toStrictEqual([2, 4, 6]);
      expect(odd).toStrictEqual([1, 3, 5]);
    });

    test('should handle empty arrays', () => {
      const array: number[] = [];
      const isEven = (n: number) => n % 2 === 0;
      const [even, odd] = partition(array, isEven);

      expect(even).toStrictEqual([]);
      expect(odd).toStrictEqual([]);
    });

    test('should handle arrays where all elements match the predicate', () => {
      const array = [2, 4, 6];
      const isEven = (n: number) => n % 2 === 0;
      const [even, odd] = partition(array, isEven);

      expect(even).toStrictEqual([2, 4, 6]);
      expect(odd).toStrictEqual([]);
    });

    test('should handle arrays where no elements match the predicate', () => {
      const array = [1, 3, 5];
      const isEven = (n: number) => n % 2 === 0;
      const [even, odd] = partition(array, isEven);

      expect(even).toStrictEqual([]);
      expect(odd).toStrictEqual([1, 3, 5]);
    });
  });
});
