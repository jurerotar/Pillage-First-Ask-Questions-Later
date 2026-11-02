CREATE TABLE culture_points
(
  player_id INTEGER PRIMARY KEY,
  culture_points REAL NOT NULL,
  celebrations_held INTEGER NOT NULL DEFAULT 0 CHECK (celebrations_held >= 0),
  culture_points_updated_at INTEGER NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
