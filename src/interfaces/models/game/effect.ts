/**
 * Effects represent bonuses and unlocked village/account benefits. Some effects are account-level, which means they apply to all villages,
 * while others effect only specific village.
 */
import { BuildingField, Village } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Resource } from 'interfaces/models/game/resource';

export type HeroEffectId =
  | 'heroSpeedBonus'
  | 'heroResourceProductionBonus'
  | 'heroStrengthBonus'
  | 'heroCarryCapacityBonus'
  | 'heroMountedUnitSpeedBonus';

export type TroopTrainingDurationEffectId =
  | 'barracksTrainingDuration'
  | 'greatBarracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'greatStableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'hospitalTrainingDuration';

export type TroopSpeedBonusEffectId = 'unitSpeedBonus' | 'unitSpeedAfter20TilesBonus';

export type BuildingEffectId = 'villageDefenceValue' | 'villageDefenceBonus' | 'buildingDurabilityBonus' | 'buildingDuration';

export type ResourceProductionEffectId = 'woodProduction' | 'clayProduction' | 'ironProduction' | 'wheatProduction';

export type EffectId =
  | HeroEffectId
  | TroopTrainingDurationEffectId
  | TroopSpeedBonusEffectId
  | BuildingEffectId
  | ResourceProductionEffectId
  | 'amountOfUncoveredAttackingUnits'
  // Research levels
  | 'amountOfUnlockedUnitResearchLevels'
  // Defence modifiers

  // Building duration
  | 'woodProductionBonus'
  | 'clayProductionBonus'
  | 'ironProductionBonus'
  | 'wheatProductionBonus'
  | 'oasisProductionBonus'
  | 'woodOasisProductionBonus'
  | 'clayOasisProductionBonus'
  | 'ironOasisProductionBonus'
  | 'wheatOasisProductionBonus'
  | 'oasisExpansionSlot'
  // Crop consumption
  | 'cropConsumption'
  // Culture points production
  | 'culturePointsProduction'
  | 'culturePointsProductionBonus'
  | 'trapperCapacity'
  | 'crannyCapacity'
  | 'crannyCapacityBonus'
  | 'breweryAttackBonus'
  | 'embassyCapacity'
  | 'merchantAmount'
  | 'merchantCapacityBonus'
  | 'granaryCapacity'
  | 'warehouseCapacity';

export enum EffectType {
  GLOBAL = 'global',
  VILLAGE = 'village',
  VILLAGE_BUILDING = 'village-building',
  VILLAGE_OASIS = 'village-oasis',
}

export type GlobalEffect = WithServerId<{
  scope: 'global';
  value: number;
}>;

export type VillageEffect = {
  villageId: Village['id'];
  scope: 'village';
  value: number;
};

export type VillageBuildingEffect = VillageEffect & {
  buildingFieldId: BuildingField['id'];
  value: number;
};

export type VillageOasisProductionBonusEffect = {
  scope: 'village';
  villageId: Village['id'];
  tileId: Tile['id'] | null;
  oasisExpansionSlotId: number;
} & Record<Resource, number>;

type EffectTypeToEffectPropertiesMap<T extends EffectType> = {
  [EffectType.GLOBAL]: GlobalEffect;
  [EffectType.VILLAGE]: VillageEffect;
  [EffectType.VILLAGE_BUILDING]: VillageBuildingEffect;
  [EffectType.VILLAGE_OASIS]: VillageOasisProductionBonusEffect;
}[T];

export type Effect<T extends EffectType | void = void> = WithServerId<
  {
    id: EffectId;
    scope: 'global' | 'village';
  } & (T extends void ? object : EffectTypeToEffectPropertiesMap<T>) // @ts-expect-error - We need a generic GameEvent as well as more defined one
>;
