CREATE TABLE scheduled_building_upgrades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL,
  village_id INTEGER NOT NULL,
  building_field_id INTEGER NOT NULL,
  level INTEGER NOT NULL,

  FOREIGN KEY (building_id) REFERENCES building_ids (id),
  FOREIGN KEY (village_id) REFERENCES villages (id)
);
