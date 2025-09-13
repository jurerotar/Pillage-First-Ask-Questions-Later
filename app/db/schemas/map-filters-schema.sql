CREATE TABLE map_filters
(
  should_show_faction_reputation BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_faction_reputation IN (0, 1)),
  should_show_oasis_icons        BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_oasis_icons IN (0, 1)),
  should_show_troop_movements    BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_troop_movements IN (0, 1)),
  should_show_wheat_fields       BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_wheat_fields IN (0, 1)),
  should_show_tile_tooltips      BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_tile_tooltips IN (0, 1)),
  should_show_treasure_icons     BOOLEAN NOT NULL DEFAULT 0 CHECK (should_show_treasure_icons IN (0, 1))
);
