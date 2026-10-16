CREATE TABLE hero_equipped_items
(
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
  item_id INTEGER NOT NULL,
  amount INTEGER DEFAULT 1,

  PRIMARY KEY (hero_id, slot),

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
