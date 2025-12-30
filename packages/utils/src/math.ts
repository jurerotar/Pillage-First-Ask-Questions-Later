import type { Coordinates } from '@pillage-first/types/models/coordinates';

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
