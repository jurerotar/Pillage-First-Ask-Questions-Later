CREATE TABLE bookmarks
(
  id          INTEGER PRIMARY KEY,
  building_id TEXT NOT NULL,
  tab_name    TEXT NOT NULL
);

CREATE INDEX idx_bookmarks_building_id ON bookmarks(building_id);
