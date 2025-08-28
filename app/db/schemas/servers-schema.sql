CREATE TABLE servers
(
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  seed TEXT NOT NULL,
  speed INTEGER CHECK (speed IN (1, 2, 3, 5, 10)) NOT NULL,
  map_size INTEGER CHECK (map_size IN (100, 200, 300)) NOT NULL,
  player_name TEXT NOT NULL,
  player_tribe TEXT CHECK (player_tribe IN ('romans', 'gauls', 'teutons', 'huns', 'egyptians')) NOT NULL
);
