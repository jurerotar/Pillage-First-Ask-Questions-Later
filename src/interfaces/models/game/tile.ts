import { Point } from 'interfaces/models/common';
import { ResourceFieldComposition, Village } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';
import { Resource } from 'interfaces/models/game/resource';
import { Player } from 'interfaces/models/game/player';

export type BaseTile = WithServerId<{
  id: string;
  coordinates: Point;
  // Both backgroundColor & oasisGroup will be replaced by an actual graphic once they exist
  graphics: {
    backgroundColor: string;
  };
}>;

export type OasisResourceBonus = {
  resource: Resource;
  bonus: '25%' | '50%';
};

export type OasisTile = BaseTile & {
  type: 'oasis-tile';
  oasisResourceBonus: OasisResourceBonus[];
  graphics: {
    // Different oasis groups have different graphics
    oasisGroup: number;
    // Position in the oasisShape matrix [rowIndex, columnIndex]
    oasisGroupPosition: number[];
  };
};

export type OccupiedOasisTile = OasisTile & {
  villageId: Village['id'] | null;
};

export type OccupiableTile = BaseTile & {
  type: 'free-tile';
  resourceFieldComposition: ResourceFieldComposition;
};

export type OccupiedOccupiableTile = OccupiableTile & {
  ownedBy: Player['id'];
  treasureType: 'artifact' | 'hero-item' | 'currency' | 'resources' | null;
};

export type Tile = OasisTile | OccupiedOasisTile | OccupiableTile | OccupiedOccupiableTile;

export type MaybeOccupiedBaseTile = BaseTile | OccupiedOccupiableTile;
export type MaybeOccupiedOrOasisBaseTile = MaybeOccupiedBaseTile | OasisTile;
export type MaybeOccupiedOrOasisOccupiableTile = OccupiableTile | OccupiedOccupiableTile | OasisTile;
export type MaybeOccupiedOccupiableTile = OccupiableTile | OccupiedOccupiableTile;
