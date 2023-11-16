/**
 * Effects represent bonuses and unlocked village/account benefits. Some effects are account-level, which means they apply to all villages,
 * while others effect only specific village.
 */
import { Village } from 'interfaces/models/game/village';
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

// Joined effect ids
export type EffectId =
  | HeroEffectId
  | TroopTrainingDurationEffectId
  | TroopSpeedBonusEffectId
  | BuildingEffectId
  | 'amountOfUncoveredAttackingUnits'
  // Research levels
  | 'amountOfUnlockedUnitResearchLevels'
  // Defence modifiers

  // Building duration
  // Resource production
  | 'woodProduction'
  | 'clayProduction'
  | 'ironProduction'
  | 'wheatProduction'
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

export type Effect = WithServerId<{
  // Server effects affect actions from all villages, village effects affect only actions from a particular village
  scope: 'global' | 'village';
  villageId?: Village['id'];
  effectId: EffectId;
  value: number;
}>;
