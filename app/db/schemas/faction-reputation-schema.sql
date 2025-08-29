CREATE TABLE faction_reputation
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_faction TEXT NOT NULL,
  target_faction TEXT NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,

  UNIQUE (source_faction, target_faction),

  FOREIGN KEY (source_faction) REFERENCES factions (id),
  FOREIGN KEY (target_faction) REFERENCES factions (id)
);

CREATE INDEX idx_faction_reputation_target_faction ON faction_reputation (target_faction);
