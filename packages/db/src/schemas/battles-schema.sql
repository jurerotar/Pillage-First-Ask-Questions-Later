CREATE TABLE battles
(
  report_id INTEGER PRIMARY KEY,
  attacking_village_id INTEGER NOT NULL,
  defending_village_id INTEGER,
  defending_oasis_id INTEGER,
  loot_wood INTEGER NOT NULL,
  loot_clay INTEGER NOT NULL,
  loot_iron INTEGER NOT NULL,
  loot_wheat INTEGER NOT NULL,
  -- boolean
  can_attacker_see_full_report INTEGER NOT NULL,
  attacker_points INTEGER NOT NULL,
  defender_points INTEGER NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
) STRICT;
