import type { Resource } from 'app/interfaces/models/game/resource';

export type Hero = {
  stats: HeroStats;
  // Attributes determined by tribe
  staticAttributes: HeroStaticAttributes;
  // Attributes, selectable on every level
  selectableAttributes: HeroSelectableAttributes;
  resourceToProduce: Resource | 'shared';
  unitType: 'infantry' | 'cavalry';
  inventory: HeroItem[];
};

type HeroStats = {
  level: number;
  experience: number;
  health: number;
};

type HeroStaticAttributes = {
  unmountedSpeed: number;
  mountedSpeed: number;
  baseAttackPower: number;
  baseHealthRegenerationRate: number;
};

type HeroSelectableAttributes = {
  attackPower: number;
  resourceProduction: number;
  attackBonus: number;
  defenceBonus: number;
};

type HeroItemCategory = 'consumable' | 'currency' | 'resource' | 'wearable';

type HeroItemSlot = 'head' | 'torso' | 'legs' | 'gloves' | 'right-hand' | 'left-hand' | 'horse' | 'consumable';

type HeroHeadItemId = '';

type HeroTorsoItemId = '';

type HeroLegsItemId = '';

type RomanRightHandItems = '';

type GaulRightHandItems = '';

type TeutonRightHandItems = '';

type EgyptianRightHandItems = '';

type HunRightHandItems = '';

type SpartanRightHandItems = '';

type HeroRightHandItemId =
  | RomanRightHandItems
  | GaulRightHandItems
  | TeutonRightHandItems
  | EgyptianRightHandItems
  | HunRightHandItems
  | SpartanRightHandItems;

type HeroLeftHandItemId = '';

type HeroHorseItemId = '';

type HeroConsumableItemId = '';

type HeroItemId =
  | HeroHeadItemId
  | HeroTorsoItemId
  | HeroLegsItemId
  | HeroLeftHandItemId
  | HeroRightHandItemId
  | HeroHorseItemId
  | HeroConsumableItemId;

export type HeroItem = {
  id: HeroItemId;
  amount: number;
  slot: HeroItemSlot;
  category: HeroItemCategory;
  baseSellPrice: number;
  baseBuyPrice: number;
};
