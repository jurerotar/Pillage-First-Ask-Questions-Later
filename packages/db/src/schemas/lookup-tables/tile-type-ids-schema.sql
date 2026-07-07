CREATE TABLE tile_type_ids
(
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('free', 'oasis'))
) STRICT;

CREATE INDEX idx_tile_type_ids_type ON tile_type_ids(type);
