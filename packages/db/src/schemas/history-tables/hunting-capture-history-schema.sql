CREATE TABLE hunting_capture_history
(
  player_id INTEGER NOT NULL REFERENCES players (id),
  unit_id INTEGER NOT NULL REFERENCES unit_ids (id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  PRIMARY KEY (player_id, unit_id)
) STRICT;
