CREATE TABLE battle_participants
(
  id INTEGER PRIMARY KEY,
  battle_id INTEGER NOT NULL,
  player_id INTEGER,
  tile_id INTEGER NOT NULL,

  FOREIGN KEY (battle_id) REFERENCES battles (id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT;
