CREATE TABLE effects
(
  id INTEGER PRIMARY KEY,
  effect_id INTEGER NOT NULL,
  value REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('base', 'bonus', 'bonus-booster')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'village', 'server')),
  source TEXT NOT NULL CHECK (source IN ('hero', 'oasis', 'artifact', 'building', 'tribe', 'server', 'troops')),
  village_id INTEGER,
  source_specifier INTEGER,

  FOREIGN KEY (effect_id) REFERENCES effect_ids (id),
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE ON UPDATE CASCADE
);

