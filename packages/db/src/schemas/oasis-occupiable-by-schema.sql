-- This table is used to speed up grid searches used with oasis-bonus-finder feature.
-- We pre-calculate all occupiable tiles in 3x3 vicinity of each occupiable oasis.
CREATE TABLE oasis_occupiable_by
(
  occupiable_tile_id INTEGER NOT NULL,
  occupiable_oasis_tile_id INTEGER NOT NULL,

  PRIMARY KEY (occupiable_tile_id, occupiable_oasis_tile_id),
  FOREIGN KEY (occupiable_tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (occupiable_oasis_tile_id) REFERENCES tiles (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
