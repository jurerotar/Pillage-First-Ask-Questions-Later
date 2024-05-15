import type { Resource } from 'interfaces/models/game/resource';
import type { WithServerId } from 'interfaces/models/game/server';

export type Hero = WithServerId<{
  stats: HeroStats;
  // Attributes determined by tribe
  staticAttributes: HeroStaticAttributes;
  // Attributes, selectable on every level
  selectableAttributes: HeroSelectableAttributes;
  resourceToProduce: Resource | 'shared';
  unitType: 'infantry' | 'cavalry';
  inventory: HeroItem[];
}>;

export type HeroStats = {
  level: number;
  experience: number;
  health: number;
};

export type HeroStaticAttributes = {
  unmountedSpeed: number;
  mountedSpeed: number;
  baseAttackPower: number;
  baseHealthRegenerationRate: number;
  resourceProduction: number;
  infantryTroopSpeedBonus: number;
  mountedTroopSpeedBonus: number;
};

export type HeroSelectableAttributes = {
  attackPower: number;
  resourceProduction: number;
  attackBonus: number;
  defenceBonus: number;
};

export type HeroItemCategory = 'consumables' | 'currency' | 'resources' | 'items' | 'troops';

export type HeroItemSlot = 'head' | 'torso' | 'legs' | 'gloves' | 'right-hand' | 'left-hand' | 'horse' | 'consumable';

export type HeroHeadItemId =
  | 'HELMET_OF_AWARENESS'
  | 'HELMET_OF_REGENERATION'
  | 'HELMET_OF_THE_GLADIATOR'
  | 'HELMET_OF_THE_HORSEMAN'
  | 'HELMET_OF_THE_MERCENARY';

export type HeroTorsoItemId = 'ARMOUR_OF_REGENERATION' | 'SCALE_ARMOUR' | 'BREAST_PLATE' | 'SEGMENTED_ARMOUR';

export type HeroLegsItemId = 'BOOTS_OF_REGENERATION' | 'BOOTS_OF_THE_MERCENARY' | 'SMALL_SPURS';

export type RomanRightHandItems =
  | 'SWORD_OF_THE_LEGIONNAIRE'
  | 'SWORD_OF_THE_PRAETORIAN'
  | 'SWORD_OF_THE_IMPERIAN'
  | 'SWORD_OF_THE_IMPERATORIS'
  | 'LANCE_OF_THE_CAESARIS';

export type GaulRightHandItems =
  | 'SPEAR_OF_THE_PHALANX'
  | 'SWORD_OF_THE_SWORDSMAN'
  | 'BOW_OF_THE_THEUTATES'
  | 'WALKING_STAFF_OF_THE_DRUIDRIDER'
  | 'LANCE_OF_THE_HAEDUAN';

export type TeutonRightHandItems =
  | 'CLUB_OF_THE_CLUBSWINGER'
  | 'SPEAR_OF_THE_SPEARMAN'
  | 'HATCHET_OF_THE_AXEMAN'
  | 'HAMMER_OF_THE_PALADIN'
  | 'SWORD_OF_THE_TEUTONIC_KNIGHT';

export type EgyptianRightHandItems =
  | 'CLUB_OF_THE_SLAVE_MILITIA'
  | 'HATCHET_OF_THE_ASH_WARDEN'
  | 'SWORD_OF_THE_KHOPESH_WARRIOR'
  | 'SPEAR_OF_THE_ANHUR_GUARD'
  | 'BOW_OF_THE_RESHEPH_CHARIOT';

export type HunRightHandItems =
  | 'HATCHET_OF_THE_MERCENARY'
  | 'BOW_OF_THE_BOWMAN'
  | 'SWORD_OF_THE_STEPPE_RIDER'
  | 'BOW_OF_THE_MARKSMAN'
  | 'SWORD_OF_THE_MARAUDER';

export type SpartanRightHandItems =
  | 'SPEAR_OF_THE_HOPLITE'
  | 'SPEAR_OF_THE_SHIELDSMAN'
  | 'SWORD_OF_THE_TWINSTEEL_THERION'
  | 'SWORD_OF_THE_ELPIDA_RIDER'
  | 'SPEAR_OF_THE_CORINTHIAN_CRUSHER';

export type HeroRightHandItemId =
  | RomanRightHandItems
  | GaulRightHandItems
  | TeutonRightHandItems
  | EgyptianRightHandItems
  | HunRightHandItems
  | SpartanRightHandItems;

export type HeroLeftHandItemId = 'SHIELD' | 'NATARIAN_HORN' | 'MAP' | 'PENNANT';

export type HeroHorseItemId = 'GELDING' | 'THOROUGHBRED' | 'WARHORSE';

export type HeroConsumableItemId = 'BUCKET' | 'BOOK_OF_WISDOM' | 'OINTMENT' | 'EXPERIENCE_SCROLL' | 'CAGE';

export type HeroItemId =
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
  baseSellPrice: number;
  baseBuyPrice: number;
};
