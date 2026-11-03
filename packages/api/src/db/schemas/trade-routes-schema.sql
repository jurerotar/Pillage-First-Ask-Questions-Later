CREATE TABLE IF NOT EXISTS trade_routes
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id INTEGER NOT NULL
    REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  target_village_id INTEGER NOT NULL
    REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  resources TEXT NOT NULL CHECK (JSON_VALID(resources)),
  interval INTEGER NOT NULL CHECK (interval > 0),
  starts_at INTEGER NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
  CHECK (village_id != target_village_id)
) STRICT;
