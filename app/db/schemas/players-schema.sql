CREATE TABLE players
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tribe TEXT NOT NULL CHECK (tribe IN ('romans','gauls','teutons','huns','egyptians')),
  faction_id TEXT NOT NULL,

  FOREIGN KEY (faction_id) REFERENCES factions (id)
);
