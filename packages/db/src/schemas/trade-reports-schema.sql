CREATE TABLE trade_reports
(
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE,
  origin_tile_id INTEGER NOT NULL,
  target_tile_id INTEGER NOT NULL,
  wood INTEGER NOT NULL CHECK (wood >= 0),
  clay INTEGER NOT NULL CHECK (clay >= 0),
  iron INTEGER NOT NULL CHECK (iron >= 0),
  wheat INTEGER NOT NULL CHECK (wheat >= 0),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (origin_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (target_tile_id) REFERENCES tiles (id)
) STRICT;
