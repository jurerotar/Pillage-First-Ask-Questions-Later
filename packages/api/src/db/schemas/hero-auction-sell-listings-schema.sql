CREATE TABLE hero_auction_sell_listings
(
  id INTEGER PRIMARY KEY,
  hero_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  price INTEGER NOT NULL CHECK (price > 0),
  sells_at INTEGER NOT NULL,

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT;
