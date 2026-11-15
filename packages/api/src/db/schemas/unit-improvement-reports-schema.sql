CREATE TABLE unit_improvement_reports
(
  report_id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  level INTEGER NOT NULL CHECK (level > 0),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
