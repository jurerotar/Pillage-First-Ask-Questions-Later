CREATE TABLE oasis_occupiable_by
(
  tile_id    INTEGER NOT NULL,
  oasis_id INTEGER NOT NULL,

  PRIMARY KEY (tile_id, oasis_id),
  FOREIGN KEY (tile_id) REFERENCES tiles(id) ON DELETE CASCADE,
  FOREIGN KEY (oasis_id) REFERENCES tiles(id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;

CREATE INDEX idx_occupiable_by_oasis_tile ON oasis_occupiable_by(oasis_id, tile_id);
