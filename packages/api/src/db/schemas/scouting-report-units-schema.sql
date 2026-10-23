CREATE TABLE scouting_report_units
(
  scouting_report_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('defender', 'reinforcement')),
  tile_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),

  PRIMARY KEY (scouting_report_id, role, tile_id, unit_id),

  FOREIGN KEY (scouting_report_id) REFERENCES scouting_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id),
  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT;
