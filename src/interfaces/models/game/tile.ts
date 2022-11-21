import { Point } from 'interfaces/models/common';
import { ResourceFieldType } from 'interfaces/models/game/village';

export type Tile = {
  x: Point['x'];
  y: Point['y'];
  isOasis: boolean;
  isOccupied: boolean;
  type?: ResourceFieldType | null;
  // Temporary
  backgroundColor: string;
  oasisGroup?: number;
};
