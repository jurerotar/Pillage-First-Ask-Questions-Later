CREATE TABLE players
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tribe_id INTEGER NOT NULL,
  faction_id INTEGER NOT NULL,
  culture_points REAL NOT NULL,
  culture_points_production REAL NOT NULL,
  culture_points_updated_at INTEGER NOT NULL,

  FOREIGN KEY (tribe_id) REFERENCES tribe_ids (id),
  FOREIGN KEY (faction_id) REFERENCES faction_ids (id)
) STRICT;
