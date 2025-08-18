CREATE TABLE world_items
(
  id       INTEGER PRIMARY KEY AUTOINCREMENT,

  item_id  TEXT    NOT NULL,
  amount   INTEGER NOT NULL CHECK (amount > 0),

  tile_id  INTEGER NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,

  type     TEXT    NOT NULL CHECK (type IN ('consumable','currency','resource','wearable','artifact'))
);
