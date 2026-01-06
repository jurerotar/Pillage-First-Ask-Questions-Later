-- This table serves to store pre-computed information about which resource icons to display on which oasis tile.
-- Since not all oasis tiles are occupiable, we need to know on which tiles to actually display the icon.
-- We determine the icon in the following manner:
-- - If oasis has 2 bonuses (ex. 25% wheat + 25% {resource}) -> {resource}
-- - If oasis only has 1 bonus -> {resource}
CREATE TABLE oasis_tile_resource
(
  tile_id INTEGER PRIMARY KEY,
  resource TEXT NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE
);
