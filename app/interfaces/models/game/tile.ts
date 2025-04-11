import type { Player } from 'app/interfaces/models/game/player';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { ResourceFieldComposition, Village } from 'app/interfaces/models/game/village';

export type BaseTile = {
  // id is constructed from tile coordinate numbers, allowing us to now include a separate coordinates object
  id: `${number}|${number}`;
};

export type OasisResourceBonus = {
  resource: Resource;
  bonus: '25%' | '50%';
};

export type OasisTile = BaseTile & {
  type: 'oasis-tile';
  // In order to reduce the final game state object size, all long property names are shortened.
  // Stands for OasisResourceBonus
  ORB: OasisResourceBonus[];
  // Values here are bit-packed into a single number to save space. Check `encodeGraphicsProperty` and `decodeGraphicsProperty` functions
  graphics: number;
  villageId: null;
};

export type OccupiedOasisTile = Omit<OasisTile, 'villageId'> & {
  villageId: Village['id'];
};

export type OccupiableTile = BaseTile & {
  type: 'free-tile';
  // In order to reduce the final game state object size, all long property names are shortened.
  // Stands for ResourceFieldComposition
  RFC: ResourceFieldComposition;
};

export type OccupiedOccupiableTile = OccupiableTile & {
  ownedBy: Player['id'];
};

export type Tile = OasisTile | OccupiedOasisTile | OccupiableTile | OccupiedOccupiableTile;

export type MaybeOccupiedBaseTile = BaseTile | OccupiedOccupiableTile;
export type MaybeOccupiedOrOasisBaseTile = MaybeOccupiedBaseTile | OasisTile;
