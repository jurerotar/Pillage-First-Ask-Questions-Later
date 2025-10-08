CREATE TABLE building_level_change_history
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  building_id TEXT NOT NULL,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id)
) STRICT;
