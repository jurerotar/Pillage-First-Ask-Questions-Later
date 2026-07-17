CREATE TABLE reports
(
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  village_id INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  combat_result_id INTEGER,

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (combat_result_id) REFERENCES combat_result_ids (id)
) STRICT;
