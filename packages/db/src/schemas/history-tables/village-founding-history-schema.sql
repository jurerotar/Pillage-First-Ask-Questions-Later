CREATE TABLE village_founding_history
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  tile_id INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id),
  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT;

CREATE INDEX idx_village_founding_history_village_id ON village_founding_history(village_id);
CREATE INDEX idx_village_founding_history_tile_id ON village_founding_history(tile_id);
