CREATE TABLE reports
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- TODO: Determine if the village_id makes sense
  village_id INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  type TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT FALSE,
  is_archived INTEGER NOT NULL DEFAULT FALSE,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT;
