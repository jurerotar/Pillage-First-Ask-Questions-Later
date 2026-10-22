CREATE TABLE culture_points
(
  player_id INTEGER PRIMARY KEY,
  culture_points REAL NOT NULL,
  culture_points_updated_at INTEGER NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
