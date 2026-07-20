CREATE TABLE hero_adventure_reports
(
  report_id INTEGER PRIMARY KEY,
  adventure_id INTEGER NOT NULL CHECK (adventure_id >= 0),
  item_id INTEGER,
  health_before INTEGER NOT NULL CHECK (health_before BETWEEN 0 AND 100),
  health_after INTEGER NOT NULL CHECK (health_after BETWEEN 0 AND 100),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
) STRICT;
