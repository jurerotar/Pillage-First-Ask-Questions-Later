CREATE TABLE game_events
(
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  village_id INTEGER,
  payload TEXT NOT NULL,    -- event-specific data (never filtered on)
  cache_keys BLOB NOT NULL, -- frontend-only
  ends_at INTEGER GENERATED ALWAYS AS (starts_at + duration_ms) VIRTUAL,

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;

CREATE INDEX idx_game_events_type ON game_events (type);
