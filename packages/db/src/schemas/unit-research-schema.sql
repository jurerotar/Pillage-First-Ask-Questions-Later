CREATE TABLE unit_research
(
  unit_id INTEGER NOT NULL,
  village_id INTEGER NOT NULL,

  PRIMARY KEY (village_id, unit_id),

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_unit_research_unit ON unit_research(village_id);

