import { prngMulberry32 } from 'ts-seedrandom';
import { describe, expect, test } from 'vitest';
import {
  seededRandomArrayElement,
  seededRandomArrayElements,
  seededRandomIntFromInterval,
  seededShuffle,
} from '../random';

describe('random utils', () => {
  describe(seededRandomIntFromInterval, () => {
    test('should return a random integer within the interval', () => {
      const prng = prngMulberry32('seed');
      expect(seededRandomIntFromInterval(prng, 1, 10)).toBe(8);
      expect(seededRandomIntFromInterval(prng, 1, 10)).toBe(3);
      expect(seededRandomIntFromInterval(prng, 1, 10)).toBe(9);
    });
  });

  describe(seededRandomArrayElement, () => {
    test('should return a random element from the array', () => {
      const array = ['a', 'b', 'c'];
      const prng = prngMulberry32('seed');
      expect(seededRandomArrayElement(prng, array)).toBe('c');
      expect(seededRandomArrayElement(prng, array)).toBe('a');
      expect(seededRandomArrayElement(prng, array)).toBe('c');
    });
  });

  describe(seededShuffle, () => {
    test('should shuffle the array deterministically', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const prng = prngMulberry32('seed');
      expect(seededShuffle(prng, array)).toStrictEqual([
        'e',
        'a',
        'c',
        'b',
        'd',
      ]);
    });

    test('should not mutate the original array', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const prng = prngMulberry32('seed');
      seededShuffle(prng, array);
      expect(array).toStrictEqual(['a', 'b', 'c', 'd', 'e']);
    });
  });

  describe(seededRandomArrayElements, () => {
    test('should return n random elements from the array', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const prng = prngMulberry32('seed');
      const result = seededRandomArrayElements(prng, array, 2);
      expect(result).toHaveLength(2);
      expect(result).toContain('d');
      expect(result).toContain('c');
    });

    test('should return all elements if n >= array length', () => {
      const array = ['a', 'b', 'c'];
      const prng = prngMulberry32('seed');
      expect(seededRandomArrayElements(prng, array, 3)).toStrictEqual([
        'a',
        'b',
        'c',
      ]);
      expect(seededRandomArrayElements(prng, array, 5)).toStrictEqual([
        'a',
        'b',
        'c',
      ]);
    });
  });
});
