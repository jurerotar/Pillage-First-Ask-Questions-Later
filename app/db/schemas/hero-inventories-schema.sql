CREATE TABLE hero_inventory
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_id INTEGER NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),

  UNIQUE (hero_id, item_id)
);
