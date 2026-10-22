CREATE TABLE farm_lists
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id INTEGER NOT NULL,
  name TEXT NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id)
) STRICT;

CREATE INDEX idx_farm_lists_village_id ON farm_lists(village_id);
