/**
 * Effects represent bonuses and unlocked village/account benefits. Some effects are account-level, which means they apply to all villages,
 * while others effect only specific village.
 */
import { BuildingField, Village } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';

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

export type TroopSpeedBonusEffectId =
  | 'unitSpeedBonus'
  | 'unitSpeedAfter20TilesBonus';

export type BuildingEffectId =
  | 'villageDefenceValue'
  | 'villageDefenceBonus'
  | 'buildingDurabilityBonus'
  | 'buildingDuration';

export type ResourceProductionEffectId =
  | 'woodProduction'
  | 'clayProduction'
  | 'ironProduction'
  | 'wheatProduction';

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

type GlobalEffect = {
  scope: 'global';
  value: number;
};

type VillageEffect = {
  scope: 'village';
  villageId: Village['id'];
  buildingFieldId: BuildingField['id'];
  value: number;
};

export type Effect = WithServerId<VillageEffect | GlobalEffect> & {
  id: string;
};
