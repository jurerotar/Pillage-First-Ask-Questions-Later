CREATE TABLE faction_reputation
(
  source_faction_id INTEGER NOT NULL,
  target_faction_id INTEGER NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (source_faction_id, target_faction_id),

  FOREIGN KEY (source_faction_id) REFERENCES factions (id),
  FOREIGN KEY (target_faction_id) REFERENCES factions (id)
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_faction_reputation_target_faction_id ON faction_reputation (target_faction_id);
