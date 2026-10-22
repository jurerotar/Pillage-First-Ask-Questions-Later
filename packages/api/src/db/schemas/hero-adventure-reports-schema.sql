CREATE TABLE hero_adventure_reports
(
  report_id INTEGER PRIMARY KEY,
  adventure_id INTEGER NOT NULL CHECK (adventure_id >= 0),
  item_id INTEGER,
  item_amount INTEGER CHECK (item_amount > 0),
  health_before INTEGER NOT NULL CHECK (health_before BETWEEN 0 AND 100),
  health_after INTEGER NOT NULL CHECK (health_after BETWEEN 0 AND 100),

  CHECK ((item_id IS NULL) = (item_amount IS NULL)),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
) STRICT;
