CREATE TEMPORARY TABLE building_data
(
  building_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  effect_id INTEGER NOT NULL REFERENCES effect_ids(id),
  value REAL NOT NULL,
  type TEXT NOT NULL,
  population INTEGER,
  PRIMARY KEY (building_id, level, effect_id, type, value)
) STRICT;

CREATE INDEX idx_building_data_building_id_level ON building_data(building_id, level);
