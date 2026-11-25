CREATE TABLE IF NOT EXISTS enemy_casualty_totals
(
  -- The player credited with inflicting the casualties.
  player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL REFERENCES unit_ids (id),
  amount INTEGER NOT NULL CHECK (amount > 0),

  PRIMARY KEY (player_id, unit_id)
) STRICT, WITHOUT ROWID;
