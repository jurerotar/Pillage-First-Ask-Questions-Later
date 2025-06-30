import type {
  BuildingField,
  Village,
} from 'app/interfaces/models/game/village';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
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
  | 'infantryDefence'
  | 'cavalryDefence'
  | 'warehouseCapacity'
  | 'granaryCapacity'
  | 'unitSpeed'
  | 'unitSpeedAfter20Fields'
  | 'unitWheatConsumption'
  | 'unitCarryCapacity'
  | 'buildingDuration'
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
  // Important rule! If value is integer, it's going to be counted as baseEffectValue. If value is float, it's going to be counter as
  // a bonus value. Rule goes base * bonus!
  value: number;
  source:
    | 'hero'
    | 'oasis'
    | 'artifact'
    | 'building'
    | 'tribe'
    | 'server'
    | 'troops';
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
  villageId: Village['id'];
};

export type VillageEffect = Omit<Effect, 'scope' | 'source'> & {
  scope: 'village';
  source: 'building' | 'oasis' | 'server' | 'troops';
  villageId: Village['id'];
};

export type VillageBuildingEffect = Omit<VillageEffect, 'source'> & {
  source: 'building';
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
};

export type ArtifactEffect = Omit<VillageEffect, 'source'> & {
  source: 'artifact';
  artifactId: ArtifactId;
};
