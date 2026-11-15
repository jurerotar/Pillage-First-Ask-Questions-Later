CREATE TEMPORARY TABLE building_data
(
  building_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  tribe TEXT,
  effect_id INTEGER NOT NULL REFERENCES effect_ids(id),
  value REAL NOT NULL,
  type TEXT NOT NULL,
  population INTEGER
) STRICT;
