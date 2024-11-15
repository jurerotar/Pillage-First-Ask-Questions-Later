import type { BuildingField, Village } from 'app/interfaces/models/game/village';

type TroopTrainingDurationEffectId =
  | 'barracksTrainingDuration'
  | 'greatBarracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'greatStableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'hospitalTrainingDuration';

export type ResourceProductionEffectId = 'woodProduction' | 'clayProduction' | 'ironProduction' | 'wheatProduction';

export type EffectId =
  | 'attack'
  | 'infantryDefence'
  | 'cavalryDefence'
  | 'warehouseCapacity'
  | 'granaryCapacity'
  | 'unitSpeed'
  | 'unitWheatConsumptionReduction'
  | 'buildingDurability'
  | 'buildingDuration'
  | 'merchantSpeed'
  | 'merchantCapacity'
  | 'crannyCapacity'
  | 'trapperCapacity'
  | ResourceProductionEffectId
  | TroopTrainingDurationEffectId;

type EffectIdBonus = `${EffectId}Bonus`;

export type Effect = {
  id: EffectId | EffectIdBonus;
  // 'server' and 'global' scopes both affect global scope, but the calculation requires differentiation between them
  scope: 'global' | 'village' | 'server';
  value: number;
  source: 'hero' | 'oasis' | 'artifact' | 'building' | 'tribe' | 'server';
};

export type ServerEffect = Omit<Effect, 'scope'> & {
  scope: 'server';
};

export type GlobalEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'global';
  source: 'hero' | 'tribe' | 'artifact';
};

export type TribalEffect = Omit<GlobalEffect, 'source'> & {
  source: 'tribe';
};

export type HeroEffect = Omit<GlobalEffect, 'source'> & {
  source: 'hero';
};

export type VillageEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'village';
  source: 'building' | 'oasis' | 'server';
  villageId: Village['id'];
};

export type VillageBuildingEffect = Omit<VillageEffect, 'source'> & {
  source: 'building';
  buildingFieldId: BuildingField['id'];
};
