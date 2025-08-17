CREATE TABLE faction_reputation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_faction TEXT NOT NULL REFERENCES factions(id),
  target_faction TEXT NOT NULL REFERENCES factions(id),
  reputation INTEGER NOT NULL DEFAULT 0,
  UNIQUE(source_faction, target_faction)
);
