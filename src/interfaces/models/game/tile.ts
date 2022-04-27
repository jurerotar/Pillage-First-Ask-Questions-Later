import { Point } from 'interfaces/models/common/point';

export type Tile = {
  x: Point['x'];
  y: Point['y'];
  isOasis: boolean;
  isOccupied: boolean;
  // Temporary
  backgroundColor: string;
  oasisGroup?: number;
};
