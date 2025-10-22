CREATE TABLE world_items
(
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  tile_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('consumable', 'currency', 'resource', 'wearable', 'artifact')
  ),

  PRIMARY KEY (tile_id, item_id),

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_world_items_tile_type ON world_items(tile_id, type);
