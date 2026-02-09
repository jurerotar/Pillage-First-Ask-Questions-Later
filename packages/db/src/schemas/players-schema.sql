CREATE TABLE players
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tribe TEXT NOT NULL,
  faction_id INTEGER NOT NULL,

  FOREIGN KEY (faction_id) REFERENCES factions (id)
) STRICT;
