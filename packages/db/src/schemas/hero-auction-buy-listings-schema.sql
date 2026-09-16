CREATE TABLE hero_auction_buy_listings
(
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  price INTEGER NOT NULL CHECK (price > 0),
  expires_at INTEGER NOT NULL
) STRICT;
