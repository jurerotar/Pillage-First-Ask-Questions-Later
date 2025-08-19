CREATE TABLE oasis
(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tile_id    INTEGER NOT NULL REFERENCES tiles (id) ON DELETE CASCADE,
  village_id INTEGER REFERENCES villages (id) ON DELETE CASCADE,
  resource   TEXT    NOT NULL CHECK (resource IN ('wood', 'clay', 'iron', 'wheat')),
  bonus      INTEGER NOT NULL CHECK (bonus IN (25, 50))
);
