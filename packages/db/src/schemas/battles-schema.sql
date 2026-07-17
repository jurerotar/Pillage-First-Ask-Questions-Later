CREATE TABLE battles
(
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE,
  origin_tile_id INTEGER NOT NULL,
  target_tile_id INTEGER NOT NULL,
  loot_wood INTEGER NOT NULL,
  loot_clay INTEGER NOT NULL,
  loot_iron INTEGER NOT NULL,
  loot_wheat INTEGER NOT NULL,
  -- boolean
  can_attacker_see_full_report INTEGER NOT NULL,
  attacker_points INTEGER NOT NULL,
  defender_points INTEGER NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (origin_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (target_tile_id) REFERENCES tiles (id)
) STRICT;
