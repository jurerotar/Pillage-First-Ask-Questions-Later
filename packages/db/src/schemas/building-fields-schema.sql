CREATE TABLE building_fields
(
  village_id INTEGER NOT NULL,
  -- Resource fields - 1-18
  -- Village building fields - 19-38
  -- Reserved village building fields:
  -- -- Rally point - 39
  -- -- Wall - 40
  field_id INTEGER NOT NULL,
  building_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (village_id, field_id),

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT, WITHOUT ROWID;
