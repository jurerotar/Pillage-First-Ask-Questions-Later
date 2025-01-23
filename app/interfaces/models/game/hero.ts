import type { Resource, Resources } from 'app/interfaces/models/game/resource';

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

type HeroItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

type HeroItemCategory = 'consumable' | 'currency' | 'resource' | 'wearable';

type HeroItemSlot = 'head' | 'torso' | 'legs' | 'gloves' | 'right-hand' | 'left-hand' | 'horse' | 'consumable';

type _UppercaseHeroItemRarity = Uppercase<HeroItemRarity>;

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

type HeroConsumableItemId = 'SILVER' | 'HEALING_POTION' | 'BOOK_OF_WISDOM' | 'ANIMAL_CAGE' | 'REVIVAL_POTION' | Uppercase<keyof Resources>;

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
  slot: HeroItemSlot;
  rarity: HeroItemRarity;
  category: HeroItemCategory;
  // Base price of null indicates item can't be bought or sold
  basePrice: number | null;
};

export type InventoryItem = HeroItem & {
  amount: number;
};
