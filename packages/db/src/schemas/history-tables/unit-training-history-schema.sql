CREATE TABLE unit_training_history
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  batch_id TEXT NOT NULL,
  unit_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id),
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id),
  FOREIGN KEY (building_id) REFERENCES building_ids (id),

  UNIQUE (batch_id, unit_id)
) STRICT;

CREATE INDEX idx_unit_training_history_village_id ON unit_training_history(village_id);
CREATE INDEX idx_unit_training_history_unit_id ON unit_training_history(unit_id);
CREATE INDEX idx_unit_training_history_building_id ON unit_training_history(building_id);
