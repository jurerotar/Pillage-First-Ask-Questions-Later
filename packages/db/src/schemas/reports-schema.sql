CREATE TABLE reports
(
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  village_id INTEGER NOT NULL,
  defender_tile_id INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  payload TEXT NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (defender_tile_id) REFERENCES tiles (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_reports_village_id ON reports (village_id);
CREATE INDEX idx_reports_timestamp ON reports (timestamp);
