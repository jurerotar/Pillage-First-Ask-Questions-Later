CREATE TABLE IF NOT EXISTS scheduled_building_construction_cancellation_history
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id),
  FOREIGN KEY (building_id) REFERENCES building_ids (id)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_scheduled_building_construction_cancellation_history_village_id ON scheduled_building_construction_cancellation_history(village_id);
