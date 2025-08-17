CREATE TABLE players (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name TEXT NOT NULL,
   slug TEXT NOT NULL,
   tribe TEXT NOT NULL,
   faction_id TEXT NOT NULL REFERENCES factions(id)
);

CREATE INDEX idx_players_slug ON players(slug);
