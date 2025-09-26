CREATE TABLE map_markers
(
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  tile_id INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE

) STRICT;

CREATE INDEX idx_map_markers_tile_id ON map_markers (tile_id);
