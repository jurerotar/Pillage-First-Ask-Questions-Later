CREATE TABLE loyalties
(
  tile_id INTEGER NOT NULL PRIMARY KEY,
  loyalty INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT;
