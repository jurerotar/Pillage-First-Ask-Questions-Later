CREATE TABLE unit_improvements
(
  player_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 0),

  PRIMARY KEY (player_id, unit_id),

  FOREIGN KEY (player_id) REFERENCES players (id),
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT, WITHOUT ROWID;
