CREATE TABLE villages
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  tile_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  celebration_type TEXT CHECK (celebration_type IN ('small', 'large')),
  celebration_ends_at INTEGER CHECK ((celebration_type IS NULL) = (celebration_ends_at IS NULL)),

  UNIQUE (tile_id),

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;
