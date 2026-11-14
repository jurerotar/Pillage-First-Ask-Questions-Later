CREATE TABLE battle_reports
(
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE,
  origin_tile_id INTEGER NOT NULL,
  target_tile_id INTEGER NOT NULL,
  -- boolean
  is_raid INTEGER NOT NULL CHECK (is_raid IN (0, 1)),
  loot_wood INTEGER NOT NULL CHECK (loot_wood >= 0),
  loot_clay INTEGER NOT NULL CHECK (loot_clay >= 0),
  loot_iron INTEGER NOT NULL CHECK (loot_iron >= 0),
  loot_wheat INTEGER NOT NULL CHECK (loot_wheat >= 0),
  attacker_points INTEGER NOT NULL CHECK (attacker_points >= 0),
  defender_points INTEGER NOT NULL CHECK (defender_points >= 0),

  village_destroyed INTEGER NOT NULL CHECK (village_destroyed IN (0, 1)),
  CHECK (origin_tile_id != target_tile_id),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (origin_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (target_tile_id) REFERENCES tiles (id)
) STRICT;
