CREATE TABLE effect_ids
(
  id INTEGER PRIMARY KEY,
  effect TEXT NOT NULL UNIQUE CHECK (effect IN ('attack', 'defence', 'defenceBonus', 'infantryDefence', 'cavalryDefence', 'warehouseCapacity', 'granaryCapacity', 'unitSpeed', 'unitSpeedAfter20Fields', 'unitWheatConsumption', 'unitCarryCapacity', 'buildingDuration', 'unitResearchDuration', 'unitImprovementDuration', 'merchantSpeed', 'merchantCapacity', 'merchantAmount', 'crannyCapacity', 'trapperCapacity', 'revealedIncomingTroopsAmount', 'woodProduction', 'clayProduction', 'ironProduction', 'wheatProduction', 'barracksTrainingDuration', 'greatBarracksTrainingDuration', 'stableTrainingDuration', 'greatStableTrainingDuration', 'workshopTrainingDuration', 'hospitalTrainingDuration'))
) STRICT;

CREATE INDEX idx_effect_ids_effect ON effect_ids(effect);
