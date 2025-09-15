CREATE TABLE hero_inventory
(
  hero_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),

  PRIMARY KEY (hero_id, item_id),

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
