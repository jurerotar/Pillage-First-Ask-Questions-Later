CREATE INDEX idx_tiles_type_xy ON tiles(type_id, x, y);

CREATE INDEX idx_tiles_xy ON tiles(x, y);
