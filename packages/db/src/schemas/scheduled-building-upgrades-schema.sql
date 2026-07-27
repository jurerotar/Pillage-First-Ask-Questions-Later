CREATE TABLE IF NOT EXISTS scheduled_building_upgrades
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL,
  village_id INTEGER NOT NULL,
  building_field_id INTEGER NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),

  FOREIGN KEY (building_id) REFERENCES building_ids (id),
  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduled_building_upgrades_village_order
  ON scheduled_building_upgrades (village_id, id);

CREATE INDEX IF NOT EXISTS idx_scheduled_building_upgrades_field_level
  ON scheduled_building_upgrades (village_id, building_field_id, level);
