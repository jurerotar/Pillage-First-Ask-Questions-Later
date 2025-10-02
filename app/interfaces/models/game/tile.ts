import type { Player } from 'app/interfaces/models/game/player';
import type { Resource } from 'app/interfaces/models/game/resource';
import type {
  ResourceFieldComposition,
  Village,
  VillageSize,
} from 'app/interfaces/models/game/village';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import type { TroopMovementType } from 'app/components/icons/icons';

export type TileModel = {
  id: number;
  x: number;
  y: number;
  type: 'free' | 'oasis';
  resource_field_composition: ResourceFieldComposition | null;
  oasis_graphics: number | null;
};

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

export type MaybeOccupiedBaseTile = BaseTile | OccupiedOccupiableTile;
export type MaybeOccupiedOrOasisBaseTile = MaybeOccupiedBaseTile | OasisTile;

type ContextualBaseTile = BaseTile & {
  troopMovementIcon: TroopMovementType | null;
};

type ContextualOasisTile = ContextualBaseTile & OasisTile;

type ContextualOccupiedOasisTile = ContextualBaseTile & OccupiedOasisTile;

type ContextualOccupiableTile = ContextualBaseTile & OccupiableTile;

export type ContextualOccupiedOccupiableTile = ContextualBaseTile &
  OccupiedOccupiableTile & {
    villageSize: VillageSize;
    tribe: Tribe;
    reputationLevel: Reputation['reputationLevel'];
    worldItem: WorldItem | null;
  };

export type ContextualTile =
  | ContextualOasisTile
  | ContextualOccupiedOasisTile
  | ContextualOccupiableTile
  | ContextualOccupiedOccupiableTile;
