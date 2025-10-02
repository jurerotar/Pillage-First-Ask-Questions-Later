CREATE TABLE events
(
  id   TEXT PRIMARY KEY,
  type TEXT NOT NULL,

  starts_at INTEGER NOT NULL,
  duration  INTEGER NOT NULL CHECK (duration >= 0), -- duration in ms

  -- Event-specific payload (the different event argument shapes) stored as JSON.
  meta TEXT NOT NULL CHECK (json_valid(meta))
) STRICT;
