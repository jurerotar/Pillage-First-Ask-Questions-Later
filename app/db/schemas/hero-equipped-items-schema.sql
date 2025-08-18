CREATE TABLE hero_equipped_items
(
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_id INTEGER NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
  slot    TEXT    NOT NULL CHECK (slot IN ('head', 'torso', 'legs', 'right-hand', 'left-hand', 'horse', 'consumable')),
  item_id TEXT,
  amount  INTEGER,
  UNIQUE (hero_id, slot)
);

CREATE INDEX idx_hero_equipped_items_hero_id ON hero_equipped_items(hero_id);
