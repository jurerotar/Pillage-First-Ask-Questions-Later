CREATE TABLE unit_improvement_history
(
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id),
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
