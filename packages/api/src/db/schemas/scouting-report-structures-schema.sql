CREATE TABLE scouting_report_structures
(
  scouting_report_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 0),

  PRIMARY KEY (scouting_report_id, building_id),

  FOREIGN KEY (scouting_report_id) REFERENCES scouting_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (building_id) REFERENCES building_ids (id)
) STRICT;
