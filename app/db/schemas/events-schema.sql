CREATE TABLE events
(
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  resolves_at INTEGER GENERATED ALWAYS AS (starts_at + duration) STORED,
  village_id INTEGER DEFAULT NULL,
  meta TEXT DEFAULT NULL, -- Event-specific payload (the different event argument shapes) stored as JSON.

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_events_resolves_at ON events (resolves_at);
CREATE INDEX idx_events_type ON events (type);
CREATE INDEX idx_events_village_id ON events(village_id);

