import type { ResourceFieldComposition } from 'app/interfaces/models/game/village';

export type DbTile = {
  id: number;
  x: number;
  y: number;
  type: 'free-tile' | 'oasis-tile';
  resource_field_composition: ResourceFieldComposition | null;
  oasis_graphics: number | null;
};
