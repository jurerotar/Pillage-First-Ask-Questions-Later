CREATE TABLE unit_research
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id TEXT NOT NULL,
  village_id TEXT NOT NULL,

  UNIQUE (village_id, unit_id),

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
);

CREATE INDEX idx_unit_research_village_id ON unit_research (village_id);
