CREATE TABLE battle_report_participants
(
  id INTEGER PRIMARY KEY,
  battle_id INTEGER NOT NULL,
  player_id INTEGER,
  tile_id INTEGER NOT NULL,

  UNIQUE (battle_id, tile_id),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT;
