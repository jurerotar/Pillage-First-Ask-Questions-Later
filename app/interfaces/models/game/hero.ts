import type { Resource, Resources } from 'app/interfaces/models/game/resource';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Tribe } from 'app/interfaces/models/game/tribe';

type HeroStats = {
  experience: number;
  health: number;
};

type HeroSelectableAttributes = {
  attackPower: number;
  resourceProduction: number;
  attackBonus: number;
  defenceBonus: number;
};

export type HeroItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

type HeroItemCategory = 'consumable' | 'currency' | 'resource' | 'wearable' | 'artifact';

type HeroItemSlot = 'head' | 'torso' | 'legs' | 'right-hand' | 'left-hand' | 'horse' | 'consumable' | 'non-equipable';

type UppercaseHeroItemRarity<Item extends string> = `${Uppercase<HeroItemRarity>}_${Item}`;

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

type HeroHorseItemId = UppercaseHeroItemRarity<'HORSE'>;

type HeroConsumableItemId = 'SILVER' | 'HEALING_POTION' | 'BOOK_OF_WISDOM' | 'ANIMAL_CAGE' | 'REVIVAL_POTION' | Uppercase<keyof Resources>;

type ArtifactRarity = Uppercase<Exclude<HeroItemRarity, 'common'>>;

type MilitaryArtifactId =
  `${ArtifactRarity}_ARTIFACT_MILITARY_${'TROOP_TRAVEL_SPEED' | 'TROOP_CARRYING_CAPACITY' | 'TROOP_TRAINING_REDUCTION' | 'TROOP_WHEAT_CONSUMPTION_REDUCTION'}`;
type CivilArtifactId =
  `${ArtifactRarity}_ARTIFACT_CIVIL_${'BUILD_TIME_REDUCTION' | 'OASIS_PRODUCTION_BONUS' | 'RESOURCE_PRODUCTION_BONUS' | 'ENABLE_GREAT_BUILDINGS'}`;

export type ArtifactId = MilitaryArtifactId | CivilArtifactId;

type HeroBonus = {
  attribute: 'power' | 'speed';
  value: number;
};

type HeroItemId =
  | HeroHeadItemId
  | HeroTorsoItemId
  | HeroLegsItemId
  | HeroLeftHandItemId
  | HeroRightHandItemId
  | HeroHorseItemId
  | HeroConsumableItemId
  | ArtifactId;

export type HeroItem = {
  id: HeroItemId;
  slot: HeroItemSlot;
  rarity: HeroItemRarity;
  category: HeroItemCategory;
  // Base price of null indicates item can't be bought or sold
  basePrice: number | null;
  effects?: Effect[];
  heroBonus?: HeroBonus[];
};

export type InventoryItem = HeroItem & {
  amount: number;
};

export type Hero = {
  stats: HeroStats;
  // Attributes, selectable on every level
  selectableAttributes: HeroSelectableAttributes;
  resourceToProduce: Resource | 'shared';
  unitType: 'infantry' | 'cavalry';
  equippedItems: {
    horse: null | HeroHorseItemId;
    head: null | HeroHeadItemId;
    torso: null | HeroTorsoItemId;
    legs: null | HeroLegsItemId;
    'right-hand': null | HeroRightHandItemId;
    'left-hand': null | HeroLeftHandItemId;
    consumable: null | {
      id: HeroConsumableItemId;
      amount: number;
    };
  };
  inventory: InventoryItem[];
  adventureCount: number;
  tribe: Tribe;
};
