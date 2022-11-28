import { Point } from 'interfaces/models/common';
import { ResourceFieldType } from 'interfaces/models/game/village';

export type Tile = {
  coordinates: Point;
  // Border fields surround the map and are a type of wood/iron oasis with no way to occupy them
  isOasis: boolean;
  isOccupied: boolean;
  type?: ResourceFieldType | null;
  isBorderField?: boolean;
  // Temporary
  backgroundColor: string;
  oasisGroup?: number;
};
