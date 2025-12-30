import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import type { Player } from './player';
import type { Resource } from './resource';
import type { ResourceFieldComposition } from './resource-field-composition';
import type { Village } from './village';

export const tileTypeSchema = z.enum(['free', 'oasis']);

export const baseTileSchema = z.strictObject({
  id: z.number(),
  coordinates: coordinatesSchema,
  type: tileTypeSchema,
});

type BaseTile = {
  id: number;
  coordinates: {
    x: number;
    y: number;
  };
};

export type OasisResourceBonus = {
  resource: Resource;
  bonus: '25%' | '50%';
};

export type OasisTile = BaseTile & {
  // We have 1 instead of 'oasis-tile' to save space
  type: 1;
  // In order to reduce the final game state object size, all long property names are shortened.
  // Stands for OasisResourceBonus
  // TODO: Check if it's worth to bit-pack this
  ORB: OasisResourceBonus[];
  // Values here are bit-packed into a single number to save space. Check `encodeGraphicsProperty` and `decodeGraphicsProperty` functions
  graphics: number;
  villageId: Village['id'] | null;
};

export type OccupiedOasisTile = Omit<OasisTile, 'villageId'> & {
  villageId: Village['id'];
};

export type OccupiableTile = BaseTile & {
  // We have 0 instead of 'free-tile' to save space
  type: 0;
  // In order to reduce the final game state object size, all long property names are shortened.
  // Stands for ResourceFieldComposition
  resourceFieldComposition: ResourceFieldComposition;
};

export type OccupiedOccupiableTile = OccupiableTile & {
  ownedBy: Player['id'];
};

export type Tile =
  | OasisTile
  | OccupiedOasisTile
  | OccupiableTile
  | OccupiedOccupiableTile;
