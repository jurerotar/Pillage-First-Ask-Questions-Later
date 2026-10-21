CREATE TABLE hunting_party_reports (
  id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  village_tile_id INTEGER NOT NULL REFERENCES tiles(id)
) STRICT;
