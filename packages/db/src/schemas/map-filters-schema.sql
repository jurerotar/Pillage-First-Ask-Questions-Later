CREATE TABLE map_filters
(
  player_id INTEGER PRIMARY KEY,
  should_show_faction_reputation INTEGER NOT NULL CHECK (should_show_faction_reputation IN (0, 1)),
  should_show_oasis_icons        INTEGER NOT NULL CHECK (should_show_oasis_icons IN (0, 1)),
  should_show_troop_movements    INTEGER NOT NULL CHECK (should_show_troop_movements IN (0, 1)),
  should_show_wheat_fields       INTEGER NOT NULL CHECK (should_show_wheat_fields IN (0, 1)),
  should_show_tile_tooltips      INTEGER NOT NULL CHECK (should_show_tile_tooltips IN (0, 1)),
  should_show_treasure_icons     INTEGER NOT NULL CHECK (should_show_treasure_icons IN (0, 1)),

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT;
