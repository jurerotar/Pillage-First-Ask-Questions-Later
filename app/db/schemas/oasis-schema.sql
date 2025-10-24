CREATE TABLE oasis
(
  id INTEGER PRIMARY KEY,
  tile_id INTEGER NOT NULL,
  village_id INTEGER,
  resource TEXT NOT NULL,
  bonus INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_oasis_nonwheat_tileid_id
  ON oasis(tile_id, id)
  WHERE resource <> 'wheat';

CREATE INDEX IF NOT EXISTS idx_oasis_resource
  ON oasis(resource);
