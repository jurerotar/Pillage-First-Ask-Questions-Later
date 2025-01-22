import type { Point } from 'app/interfaces/models/common';
import type { Player } from 'app/interfaces/models/game/player';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { ResourceFieldComposition, Village } from 'app/interfaces/models/game/village';

export type BaseTile = {
  id: string;
  coordinates: Point;
};

export type OasisResourceBonus = {
  resource: Resource;
  bonus: '25%' | '50%';
};

export type OasisTile = BaseTile & {
  type: 'oasis-tile';
  oasisResourceBonus: OasisResourceBonus[];
  // TODO: Just these properties take up ~ 700KB of size, should probably rename in the future
  graphics: {
    oasisResource: Resource;
    // Different oasis groups have different graphics
    oasisGroup: number;
    // Position in the oasisShape matrix [rowIndex, columnIndex]
    oasisGroupPosition: number[];
    oasisVariant: number;
  };
  villageId: null;
};

export type OccupiableOasisTile = OasisTile & {
  villageId: null;
};

export type OccupiedOasisTile = Omit<OasisTile, 'villageId'> & {
  villageId: Village['id'];
};

export type OccupiableTile = BaseTile & {
  type: 'free-tile';
  resourceFieldComposition: ResourceFieldComposition;
};

export type OccupiedOccupiableTile = OccupiableTile & {
  ownedBy: Player['id'];
};

export type Tile = OasisTile | OccupiedOasisTile | OccupiableTile | OccupiedOccupiableTile;

export type MaybeOccupiedBaseTile = BaseTile | OccupiedOccupiableTile;
export type MaybeOccupiedOrOasisBaseTile = MaybeOccupiedBaseTile | OasisTile;
export type MaybeOccupiedOrOasisOccupiableTile = OccupiableTile | OccupiedOccupiableTile | OasisTile;
