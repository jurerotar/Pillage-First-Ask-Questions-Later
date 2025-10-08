CREATE TABLE resource_sites
(
  tile_id INTEGER PRIMARY KEY,
  wood INTEGER NOT NULL,
  clay INTEGER NOT NULL,
  iron INTEGER NOT NULL,
  wheat INTEGER NOT NULL,
  updated_at REAL NOT NULL,

  CHECK (wood >= 0 AND clay >= 0 AND iron >= 0 AND wheat >= 0),

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;
