CREATE TABLE battles
(
  report_id INTEGER PRIMARY KEY,
  attacking_player_name TEXT NOT NULL,
  attacking_player_slug TEXT NOT NULL,
  defending_player_name TEXT NOT NULL,
  defending_player_slug TEXT NOT NULL,
  origin_village_name TEXT NOT NULL,
  origin_village_x INTEGER NOT NULL,
  origin_village_y INTEGER NOT NULL,
  target_village_name TEXT NOT NULL,
  target_village_x INTEGER NOT NULL,
  target_village_y INTEGER NOT NULL,
  loot_wood INTEGER NOT NULL,
  loot_clay INTEGER NOT NULL,
  loot_iron INTEGER NOT NULL,
  loot_wheat INTEGER NOT NULL,
  total_carry_capacity INTEGER NOT NULL,
  -- boolean
  did_attacker_win INTEGER NOT NULL,
  attacker_points INTEGER NOT NULL,
  attacker_supply_before INTEGER NOT NULL,
  attacker_supply_lost INTEGER NOT NULL,
  attacker_resources_lost INTEGER NOT NULL,
  defender_points INTEGER NOT NULL,
  defender_supply_before INTEGER NOT NULL,
  defender_supply_lost INTEGER NOT NULL,
  defender_resources_lost INTEGER NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
) STRICT;
