-- Villages table assumed elsewhere:
-- CREATE TABLE villages(id INTEGER PRIMARY KEY, ...);

CREATE TABLE game_events
(
  id          TEXT PRIMARY KEY,
  type        TEXT    NOT NULL,
  starts_at   INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  village_id  INTEGER,
  -- Event-specific parameters (never filtered on):
  payload     TEXT    NOT NULL,
  cache_keys  BLOB    NOT NULL,
  ends_at     INTEGER GENERATED ALWAYS AS (starts_at + duration_ms) VIRTUAL,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE ON UPDATE CASCADE
);
