import type { Point } from 'app/interfaces/models/common';
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
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(prng() * (len - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    result.push(array[indices[i]]);
  }

  return result;
};

export const seededShuffleArray = <T>(prng: PRNGFunction, array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

export const calculateDistanceBetweenPoints = (
  firstPoint: Point,
  secondPoint: Point,
): number => {
  const dx = secondPoint.x - firstPoint.x;
  const dy = secondPoint.y - firstPoint.y;

  return Math.sqrt(dx ** 2 + dy ** 2);
};

export const roundTo2DecimalPoints = (number: number): number => {
  return Math.round(number * 100) / 100;
};

export const roundTo5 = (n: number) => {
  return Math.round(n / 5) * 5;
};

export const formatNumberWithCommas = (number: number): string => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const truncateToShortForm = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000) {
    const raw = absValue / 1_000_000;
    const truncated = Math.trunc(raw * 10) / 10;
    const intPart = Math.trunc(truncated);
    const showDecimal = intPart < 100;

    return `${sign}${showDecimal ? truncated : intPart}M`;
  }

  if (absValue >= 1_000) {
    const raw = absValue / 1_000;
    const truncated = Math.trunc(raw * 10) / 10;
    const intPart = Math.trunc(truncated);
    const showDecimal = intPart < 100;

    return `${sign}${showDecimal ? truncated : intPart}K`;
  }

  return `${value}`;
};

export const partition = <T>(
  array: T[],
  callback: (element: T) => boolean,
): [T[], T[]] => {
  return array.reduce(
    (result, element) => {
      result[callback(element) ? 0 : 1].push(element);
      return result;
    },
    [[] as T[], [] as T[]],
  );
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const timeExecution = async (
  callback: () => void | Promise<void>,
  name = 'Performance mark',
) => {
  performance.mark(`${name} - start`);
  await callback();
  performance.mark(`${name} - end`);
  performance.measure(name, `${name} - start`, `${name} - end`);
};

export const formatPercentage = (num: number, isIncreasing = true): string => {
  if (num === 1) {
    return isIncreasing ? '0%' : '100%';
  }

  // Normal case: strip off the integer part (so 1.25 -> 0.25)
  const fractionalPart = num - Math.floor(num);
  const percentage = fractionalPart * 100;
  return `${Math.round(percentage)}%`;
};

export const formatNumber = (number: number): string => {
  return number.toLocaleString();
};
