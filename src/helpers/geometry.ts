import { Point } from 'interfaces/models/common/point';

export const cartesianToIsometric = (point: Point): Point => {
  return {
    x: point.x - point.y,
    y: (point.x + point.y) / 2
  };
};

export const isometricToCartesian = (point: Point): Point => {
  return {
    x: (2 * point.y + point.x) / 2,
    y: (2 * point.y - point.x) / 2
  };
};
