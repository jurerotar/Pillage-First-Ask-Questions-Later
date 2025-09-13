CREATE TABLE hero_equipped_items
(
  id INTEGER PRIMARY KEY,
  hero_id INTEGER NOT NULL,
  slot TEXT NOT NULL CHECK (
    slot IN
    (
     'head',
     'torso',
     'legs',
     'right-hand',
     'left-hand',
     'horse',
     'consumable'
      )
    ),
  item_id TEXT,
  amount INTEGER,

  CHECK ((item_id IS NULL AND amount IS NULL) OR (item_id IS NOT NULL AND amount > 0)),

  UNIQUE (hero_id, slot),

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
);
