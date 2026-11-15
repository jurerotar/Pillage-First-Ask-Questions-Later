CREATE TABLE world_items
(
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  tile_id INTEGER NOT NULL,

  PRIMARY KEY (tile_id, item_id),

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
