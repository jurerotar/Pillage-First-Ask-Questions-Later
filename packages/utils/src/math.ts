import type { Coordinates } from '@pillage-first/types/models/coordinates';

export const calculateProgressPercentage = (
  value: number,
  min: number,
  max: number,
): number => {
  if (max <= min) {
    return 100;
  }

  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
};

export const calculateDistanceBetweenPoints = (
  firstPoint: Coordinates,
  secondPoint: Coordinates,
): number => {
  const dx = secondPoint.x - firstPoint.x;
  const dy = secondPoint.y - firstPoint.y;

  return Math.sqrt(dx ** 2 + dy ** 2);
};

export const roundToNDecimalPoints = (number: number, n = 2): number => {
  return Math.round(number * 10 ** n) / 10 ** n;
};

export const roundTo5 = (n: number): number => {
  return Math.round(n / 5) * 5;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
