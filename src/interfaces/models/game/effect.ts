export type AvailableEffects =
  'barracksTrainingDuration'
  | 'stableTrainingDuration'
  | 'workshopTrainingDuration'
  | 'buildingDuration'
  | 'woodProductionBonus'
  | 'clayProductionBonus'
  | 'ironProductionBonus'
  | 'wheatProductionBonus'
  | 'troopSpeedBonus'
  | 'infantrySpeedBonus'
  | 'cavalrySpeedBonus'
  | 'siegeEngineSpeedBonus';

export type Effects = {
  [key in AvailableEffects]: number;
};
