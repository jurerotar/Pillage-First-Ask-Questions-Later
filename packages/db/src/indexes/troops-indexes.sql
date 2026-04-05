CREATE INDEX idx_troops_unit_id ON troops (unit_id);
CREATE INDEX idx_troops_tile_id ON troops (tile_id);
CREATE INDEX idx_troops_source_tile_id ON troops (source_tile_id);
CREATE INDEX idx_troops_tile_unit ON troops(tile_id, unit_id);
