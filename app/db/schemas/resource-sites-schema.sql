CREATE TABLE resource_sites
(
  tile_id     INTEGER PRIMARY KEY,

  wood        INTEGER NOT NULL DEFAULT 0,
  clay        INTEGER NOT NULL DEFAULT 0,
  iron        INTEGER NOT NULL DEFAULT 0,
  wheat       INTEGER NOT NULL DEFAULT 0,

  updated_at INTEGER NOT NULL,

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
