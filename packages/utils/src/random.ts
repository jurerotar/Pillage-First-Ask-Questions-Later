import type { PRNGFunction } from 'ts-seedrandom';

export const seededRandomIntFromInterval = (
  prng: PRNGFunction,
  min: number,
  max: number,
): number => {
  return Math.floor(prng() * (max - min + 1) + min);
};

export const seededRandomArrayElement = <T>(
  prng: PRNGFunction,
  array: T[],
): T => {
  return array[Math.floor(prng() * array.length)];
};

export const seededRandomArrayElements = <T>(
  prng: PRNGFunction,
  array: T[],
  n: number,
): T[] => {
  const len = array.length;
  if (n >= len) {
    return [...array];
  }

  const result: T[] = [];
  const indices = Array.from({ length: len }, (_, i) => i);

  // Partial Fisher-Yates shuffle
  for (let i = 0; i < n; i += 1) {
    const j = i + Math.floor(prng() * (len - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    result.push(array[indices[i]]);
  }

  return result;
};
