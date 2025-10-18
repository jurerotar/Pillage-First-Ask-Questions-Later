import type { Village } from 'app/interfaces/models/game/village';
import type { Building } from 'app/interfaces/models/game/building';

export type TroopTrainingDurationEffectId =
  | 'barracksTrainingDuration'
  | 'greatBarracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'greatStableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'hospitalTrainingDuration';

export type ResourceProductionEffectId =
  | 'woodProduction'
  | 'clayProduction'
  | 'ironProduction'
  | 'wheatProduction';

export type EffectId =
  | 'attack'
  | 'defence'
  | 'defenceBonus'
  | 'infantryDefence'
  | 'cavalryDefence'
  | 'warehouseCapacity'
  | 'granaryCapacity'
  | 'unitSpeed'
  | 'unitSpeedAfter20Fields'
  | 'unitWheatConsumption'
  | 'unitCarryCapacity'
  | 'buildingDuration'
  | 'unitResearchDuration'
  | 'unitImprovementDuration'
  | 'merchantSpeed'
  | 'merchantCapacity'
  | 'merchantAmount'
  | 'crannyCapacity'
  | 'trapperCapacity'
  | 'revealedIncomingTroopsAmount'
  | ResourceProductionEffectId
  | TroopTrainingDurationEffectId;

export type Effect = {
  id: EffectId;
  // 'server' and 'global' scopes both affect global scope, but the calculation requires differentiation between them
  scope: 'global' | 'village' | 'server';
  value: number;
  source:
    | 'hero'
    | 'oasis'
    | 'artifact'
    | 'building'
    | 'tribe'
    | 'server'
    | 'troops';
  type: 'base' | 'bonus' | 'bonus-booster';
  sourceSpecifier: number | null;
};

export type ServerEffect = Omit<Effect, 'scope'> & {
  scope: 'server';
};

export type GlobalEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'global';
  source: 'hero' | 'tribe' | 'artifact' | 'building';
};

export type TribalEffect = Omit<GlobalEffect, 'source'> & {
  source: 'tribe';
};

export type VillageEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'village';
  source: 'building' | 'oasis' | 'server' | 'troops' | 'hero';
  villageId: Village['id'];
};

export type HeroEffect = Omit<VillageEffect, 'source'> & {
  source: 'hero';
};

export type VillageBuildingEffect = Omit<VillageEffect, 'source'> & {
  source: 'building' | 'oasis';
  buildingId: Building['id'];
};

export type ArtifactEffect = Omit<VillageEffect, 'source'> & {
  source: 'artifact';
};

export type OasisEffect = Omit<VillageEffect, 'source'> & {
  source: 'oasis';
};
