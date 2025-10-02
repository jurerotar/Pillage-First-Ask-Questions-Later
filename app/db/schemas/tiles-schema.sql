CREATE TABLE tiles
(
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  -- 'free', 'oasis'
  type TEXT NOT NULL,
  -- '4446', '5436', '5346', '4536', '3546', '4356', '3456', '4437', '4347', '3447', '3339', '11115', '00018'
  resource_field_composition TEXT,
  -- Bit-packed number that describes oasis resource, oasis group, group position and variant
  oasis_graphics INTEGER
) STRICT;
