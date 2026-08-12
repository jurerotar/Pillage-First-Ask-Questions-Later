CREATE TABLE battle_report_buildings
(
  report_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  level_before INTEGER NOT NULL CHECK (level_before >= 0),
  level_after INTEGER NOT NULL CHECK (level_after >= 0),

  CHECK (level_after <= level_before),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (building_id) REFERENCES building_ids (id)
) STRICT;
