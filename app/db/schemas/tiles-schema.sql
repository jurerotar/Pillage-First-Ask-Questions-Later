CREATE TABLE tiles
(
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  -- 'free', 'oasis'
  type TEXT NOT NULL,
  resource_field_composition_id INTEGER,
  -- Bit-packed number that describes oasis resource, oasis group, group position and variant
  oasis_graphics INTEGER,

  FOREIGN KEY (resource_field_composition_id) REFERENCES resource_field_compositions (id)
) STRICT;
