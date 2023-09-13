import { Resource } from 'interfaces/models/game/resource';

export type Hero = {
  name: string;
  level: number;
  experience: number;
  health: number;
  healthRegenerationRate: number;
  speed: number;
  attackPower: number;
  resourceProduction: number;
  resourceToProduce: Resource | 'shared';
  attackBonus: number;
  defenceBonus: number;
  unitType: 'infantry' | 'cavalry';
  inventory: HeroItem[];
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
