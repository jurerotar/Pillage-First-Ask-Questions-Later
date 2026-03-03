CREATE TABLE bookmarks
(
  village_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  tab_name TEXT NOT NULL,

  PRIMARY KEY (village_id, building_id),

  FOREIGN KEY (village_id) REFERENCES villages (id),
  FOREIGN KEY (building_id) REFERENCES building_ids (id)
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_bookmarks_village_id ON bookmarks(village_id);

