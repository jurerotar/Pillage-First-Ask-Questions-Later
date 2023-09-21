import { Point } from 'interfaces/models/common';
import { ResourceFieldType } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';

export type Tile = WithServerId<{
  coordinates: Point;
  isOasis: boolean;
  isOccupied: boolean;
  type?: ResourceFieldType | null;
  // Temporary
  backgroundColor: string;
  oasisGroup?: number;
}>;
