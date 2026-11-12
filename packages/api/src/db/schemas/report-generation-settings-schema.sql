CREATE TABLE IF NOT EXISTS report_generation_settings
(
  player_id INTEGER NOT NULL,
  filter    TEXT    NOT NULL,

  PRIMARY KEY (player_id, filter),
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT;
