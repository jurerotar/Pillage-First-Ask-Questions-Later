CREATE TABLE reports
(
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  village_id INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  type_id INTEGER NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES report_type_ids (id)
) STRICT;
