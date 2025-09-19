CREATE TABLE faction_reputation
(
  source_faction TEXT NOT NULL,
  target_faction TEXT NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (source_faction, target_faction),

  FOREIGN KEY (source_faction) REFERENCES factions (id),
  FOREIGN KEY (target_faction) REFERENCES factions (id)
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_faction_reputation_target_faction ON faction_reputation (target_faction);
