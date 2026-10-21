CREATE TABLE IF NOT EXISTS wounded_troops
(
  village_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  updated_at INTEGER NOT NULL,

  PRIMARY KEY (village_id, unit_id),

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
