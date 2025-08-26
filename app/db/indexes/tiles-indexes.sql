CREATE UNIQUE INDEX idx_tiles_base_xy ON tiles_base (x, y);
CREATE INDEX idx_tiles_base_type_id ON tiles_base (type_id);
