import { Resource } from 'interfaces/models/game/resource';
import { WithServerId } from 'interfaces/models/game/server';

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
};

export type HeroSelectableAttributes = {
  attackPower: number;
  resourceProduction: number;
  attackBonus: number;
  defenceBonus: number;
};

export type HeroItemSlot = 'head' | 'torso' | 'legs' | 'gloves' | 'right-hand' | 'left-hand' | 'horse' | 'consumable';

export type HeroItem = {
  id: number;
  name: string;
  amount: number;
  slot: HeroItemSlot;
  baseSellPrice: number;
  baseBuyPrice: number;
  isWorn: boolean;
};
