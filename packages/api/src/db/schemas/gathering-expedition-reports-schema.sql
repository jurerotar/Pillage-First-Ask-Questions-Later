CREATE TABLE gathering_expedition_reports (
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  village_tile_id INTEGER NOT NULL REFERENCES tiles(id),
  tribe_id INTEGER NOT NULL REFERENCES tribe_ids(id),
  loot_wood INTEGER NOT NULL,
  loot_clay INTEGER NOT NULL,
  loot_iron INTEGER NOT NULL,
  loot_wheat INTEGER NOT NULL
) STRICT;
