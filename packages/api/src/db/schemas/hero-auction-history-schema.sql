CREATE TABLE hero_auction_history
(
  id INTEGER PRIMARY KEY,
  hero_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  price INTEGER NOT NULL CHECK (price > 0),
  completed_at INTEGER NOT NULL,

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT;
