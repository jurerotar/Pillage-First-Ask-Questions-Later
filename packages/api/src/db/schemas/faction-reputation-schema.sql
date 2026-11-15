CREATE TABLE faction_reputation
(
  player_id INTEGER NOT NULL,
  target_faction_id INTEGER NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (player_id, target_faction_id),

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  FOREIGN KEY (target_faction_id) REFERENCES faction_ids (id)
) STRICT, WITHOUT ROWID;
