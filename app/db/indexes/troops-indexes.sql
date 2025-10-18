CREATE INDEX idx_troops_tile_id ON troops (tile_id);
CREATE UNIQUE INDEX uq_troops_unit_tile_source ON troops(unit_id, tile_id, source_tile_id);
