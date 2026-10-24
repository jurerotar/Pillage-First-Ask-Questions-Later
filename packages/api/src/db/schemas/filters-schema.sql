CREATE TABLE filters
(
  player_id INTEGER NOT NULL,
  name      TEXT    NOT NULL,
  filter    TEXT    NOT NULL,

  PRIMARY KEY (player_id, name, filter),
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_filters_player_id_name ON filters(player_id, name);
