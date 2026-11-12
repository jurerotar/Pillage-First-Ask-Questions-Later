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
  minimum_resources TEXT NOT NULL DEFAULT '{"wood":0,"clay":0,"iron":0,"wheat":0}' CHECK (JSON_VALID(minimum_resources)),
  minimum_merchants INTEGER NOT NULL DEFAULT 0 CHECK (minimum_merchants >= 0),
  interval INTEGER NOT NULL CHECK (interval > 0),
  starts_at INTEGER NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
  CHECK (village_id != target_village_id)
) STRICT;
