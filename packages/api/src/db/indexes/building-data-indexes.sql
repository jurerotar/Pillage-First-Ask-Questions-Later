CREATE UNIQUE INDEX idx_building_data_generic_effect_unique ON building_data(building_id, level, effect_id, type)
  WHERE tribe IS NULL AND population IS NULL;

CREATE UNIQUE INDEX idx_building_data_tribal_effect_unique ON building_data(building_id, level, tribe, effect_id, type)
  WHERE tribe IS NOT NULL AND population IS NULL;

CREATE UNIQUE INDEX idx_building_data_generic_population_unique ON building_data(building_id, level)
  WHERE tribe IS NULL AND population IS NOT NULL;
