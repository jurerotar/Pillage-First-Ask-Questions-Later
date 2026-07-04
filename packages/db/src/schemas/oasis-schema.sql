CREATE TABLE oasis
(
  id INTEGER PRIMARY KEY,
  tile_id INTEGER NOT NULL,
  village_id INTEGER,
  resource_id INTEGER NOT NULL,
  bonus INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resource_ids (id)
) STRICT;
