import type { Player } from 'app/interfaces/models/game/player';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { Village } from 'app/interfaces/models/game/village';
import {
  type ResourceFieldComposition,
  resourceFieldCompositionSchema,
} from 'app/interfaces/models/game/resource-field-composition';
import { z } from 'zod';
import { coordinatesSchema } from 'app/interfaces/models/common';

export const tileTypeSchema = z.enum(['free', 'oasis']);

export const baseTileSchema = z.strictObject({
  id: z.number(),
  coordinates: coordinatesSchema,
  type: tileTypeSchema,
});

export const tileSchema = z.strictObject({
  resourceFieldComposition: resourceFieldCompositionSchema.nullable(),
  oasisGraphics: z.number().nullable(),
});

export type BaseTile = {
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
