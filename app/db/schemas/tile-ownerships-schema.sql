CREATE TABLE tile_ownerships
(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tile_id    INTEGER NOT NULL REFERENCES tiles (id) ON DELETE CASCADE,
  -- village_id TEXT    NOT NULL,
  player_id  TEXT,
  UNIQUE (tile_id)
);
