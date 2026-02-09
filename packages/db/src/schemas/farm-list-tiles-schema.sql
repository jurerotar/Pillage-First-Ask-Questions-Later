CREATE TABLE farm_list_tiles
(
  farm_list_id INTEGER NOT NULL,
  tile_id INTEGER NOT NULL,

  PRIMARY KEY (farm_list_id, tile_id),
  FOREIGN KEY (farm_list_id) REFERENCES farm_lists (id) ON DELETE CASCADE,
  FOREIGN KEY (tile_id) REFERENCES tiles (id)
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_farm_list_tiles_farm_list_id ON farm_list_tiles(farm_list_id);
