import { Point } from 'interfaces/models/common';
import { ResourceFieldType, Village } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';
import { Resource, ResourceCombination } from 'interfaces/models/game/resource';

export type BaseTile = WithServerId<{
  // Seed is constructed from server.id and tile index and is used for seeded prng
  seed: string;
  coordinates: Point;
  // Both backgroundColor & oasisGroup will be replaced by an actual graphic once they exist
  graphics: {
    backgroundColor: string;
    oasisGroup?: number;
  }
}>;

export type OasisTile = BaseTile & {
  type: 'oasis-tile';
  oasisType: Resource | ResourceCombination;
  oasisBonus: '25%' | '50%' | null;
};

export type OccupiedOasisTile = OasisTile & {
  ownerVillageId: Village['id'] | null;
};

export type FreeTile = BaseTile & {
  type: 'free-tile';
  resourceFieldComposition: ResourceFieldType;
};

export type OccupiedFreeTile = FreeTile & {
  ownedBy: 'player' | 'npc' | 'abandoned';
};

export type Tile =
  | OasisTile
  | OccupiedOasisTile
  | FreeTile
  | OccupiedFreeTile;

export type MaybeOccupiedBaseTile = BaseTile | OccupiedFreeTile;
export type MaybeOccupiedOrOasisBaseTile = MaybeOccupiedBaseTile | OasisTile;
export type MaybeOccupiedOrOasisFreeTile = FreeTile | OccupiedFreeTile | OasisTile;
export type MaybeOccupiedFreeTile = FreeTile | OccupiedFreeTile;
