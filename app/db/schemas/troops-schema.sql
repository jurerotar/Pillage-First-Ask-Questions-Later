CREATE TABLE troops
(
  id INTEGER PRIMARY KEY,
  unit_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  tile_id INTEGER NOT NULL,
  source_tile_id INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (source_tile_id) REFERENCES tiles (id) ON DELETE CASCADE
) STRICT;
