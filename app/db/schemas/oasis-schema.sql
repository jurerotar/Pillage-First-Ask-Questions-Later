CREATE TABLE oasis
(
  id INTEGER PRIMARY KEY,
  tile_id INTEGER NOT NULL,
  village_id INTEGER,
  resource TEXT NOT NULL CHECK (resource IN ('wood', 'clay', 'iron', 'wheat')),
  bonus INTEGER NOT NULL CHECK (bonus IN (25, 50)),

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
);
