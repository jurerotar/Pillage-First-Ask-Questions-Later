CREATE TABLE unit_research
(
  id INTEGER PRIMARY KEY,
  unit_id TEXT NOT NULL,
  village_id INTEGER NOT NULL,

  UNIQUE (village_id, unit_id),

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
);
