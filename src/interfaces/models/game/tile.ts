import { Point } from 'interfaces/models/common';
import { ResourceFieldType } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';
import { Resource } from 'interfaces/models/game/resource';

export type Tile = WithServerId<{
  // Seed is constructed from server.id and tile index and is used for seeded prng
  seed: string;
  coordinates: Point;
  isOasis: boolean;
  isOccupied: boolean;
  type: ResourceFieldType | null;
  oasisType: Resource | null;
  // graphics: {}
  // Temporary
  backgroundColor: string;
  oasisGroup?: number;
}>;
