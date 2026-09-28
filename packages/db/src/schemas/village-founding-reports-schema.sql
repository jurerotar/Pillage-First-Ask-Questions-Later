CREATE TABLE village_founding_reports
(
  report_id INTEGER PRIMARY KEY,
  origin_tile_id INTEGER NOT NULL,
  target_tile_id INTEGER NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (origin_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (target_tile_id) REFERENCES tiles (id)
) STRICT;
