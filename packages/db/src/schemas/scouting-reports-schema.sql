CREATE TABLE scouting_reports
(
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE,
  origin_tile_id INTEGER NOT NULL,
  target_tile_id INTEGER NOT NULL,
  perspective TEXT NOT NULL CHECK (perspective IN ('attacker', 'defender')),
  successful INTEGER NOT NULL CHECK (successful IN (0, 1)),
  scouting_target TEXT NOT NULL CHECK (scouting_target IN ('resources', 'defensiveStructures')),
  wood INTEGER CHECK (wood >= 0),
  clay INTEGER CHECK (clay >= 0),
  iron INTEGER CHECK (iron >= 0),
  wheat INTEGER CHECK (wheat >= 0),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (origin_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (target_tile_id) REFERENCES tiles (id)
) STRICT;
