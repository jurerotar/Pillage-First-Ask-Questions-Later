CREATE TABLE farm_lists
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  name TEXT NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id)
) STRICT;

CREATE INDEX idx_farm_lists_player_id ON farm_lists(player_id);
