CREATE TABLE tile_type_ids
(
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('free', 'oasis'))
) STRICT;
