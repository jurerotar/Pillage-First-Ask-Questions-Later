CREATE TABLE developer_settings
(
  -- Durations
  is_instant_building_construction_enabled INTEGER NOT NULL CHECK (is_instant_building_construction_enabled IN (0, 1)),
  is_instant_unit_training_enabled INTEGER NOT NULL CHECK (is_instant_unit_training_enabled IN (0, 1)),
  is_instant_unit_improvement_enabled INTEGER NOT NULL CHECK (is_instant_unit_improvement_enabled IN (0, 1)),
  is_instant_unit_research_enabled INTEGER NOT NULL CHECK (is_instant_unit_research_enabled IN (0, 1)),
  is_instant_unit_travel_enabled INTEGER NOT NULL CHECK (is_instant_unit_travel_enabled IN (0, 1)),

  -- Cost
  is_free_building_construction_enabled INTEGER NOT NULL CHECK (is_free_building_construction_enabled IN (0, 1)),
  is_free_unit_training_enabled INTEGER NOT NULL CHECK (is_free_unit_training_enabled IN (0, 1)),
  is_free_unit_improvement_enabled INTEGER NOT NULL CHECK (is_free_unit_improvement_enabled IN (0, 1)),
  is_free_unit_research_enabled INTEGER NOT NULL CHECK (is_free_unit_research_enabled IN (0, 1))
) STRICT;
