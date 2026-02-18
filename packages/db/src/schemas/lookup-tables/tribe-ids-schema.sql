CREATE TABLE tribe_ids
(
  id INTEGER PRIMARY KEY,
  tribe TEXT NOT NULL UNIQUE CHECK (tribe IN ('gauls', 'romans', 'teutons', 'egyptians', 'huns', 'spartans', 'nature', 'natars'))
) STRICT;

CREATE INDEX idx_tribe_ids_tribe ON tribe_ids(tribe);
