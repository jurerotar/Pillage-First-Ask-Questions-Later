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

CREATE INDEX idx_unit_improvement_history_player_id ON unit_improvement_history(player_id);
CREATE INDEX idx_unit_improvement_history_unit_id ON unit_improvement_history(unit_id);
