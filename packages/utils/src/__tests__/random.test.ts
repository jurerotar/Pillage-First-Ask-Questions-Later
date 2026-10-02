import type { PRNGFunction } from 'ts-seedrandom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  randomArrayElement,
  seededRandomArrayElement,
  seededRandomArrayElements,
  seededRandomIntFromInterval,
  seededShuffle,
} from '../random';

const prngFrom = (...values: number[]) => {
  let index = 0;
  return (() => values[index++] ?? 0) as PRNGFunction;
};

describe('random utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('selects the inclusive bounds of a seeded interval', () => {
    expect(seededRandomIntFromInterval(prngFrom(0), 2, 20)).toBe(2);
    expect(seededRandomIntFromInterval(prngFrom(0.999), 2, 20)).toBe(20);
  });

  test('selects the first and last array elements', () => {
    const array = ['a', 'b', 'c'];

    expect(seededRandomArrayElement(prngFrom(0), array)).toBe('a');
    expect(seededRandomArrayElement(prngFrom(0.999), array)).toBe('c');

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(randomArrayElement(array)).toBe('c');
  });

  test('shuffles a copy using the supplied random values', () => {
    const array = ['a', 'b', 'c'];

    expect(seededShuffle(prngFrom(0, 0), array)).toStrictEqual(['b', 'c', 'a']);
    expect(array).toStrictEqual(['a', 'b', 'c']);
  });

  test('selects distinct elements without mutating the input', () => {
    const array = ['a', 'b', 'c'];

    expect(seededRandomArrayElements(prngFrom(0, 0), array, 2)).toStrictEqual([
      'a',
      'b',
    ]);
    expect(array).toStrictEqual(['a', 'b', 'c']);
  });

  test('returns a copy when the requested amount covers the array', () => {
    const array = ['a', 'b', 'c'];
    const result = seededRandomArrayElements(prngFrom(), array, 3);

    expect(result).toStrictEqual(array);
    expect(result).not.toBe(array);
  });
});
