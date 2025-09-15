CREATE TABLE tiles
(
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('free', 'oasis')),
  resource_field_composition TEXT
    CHECK (resource_field_composition IN
           ('4446', '5436', '5346', '4536', '3546', '4356', '3456', '4437', '4347', '3447', '3339', '11115', '00018')
      ),
  oasis_graphics INTEGER,

  UNIQUE (x, y)
) STRICT;
