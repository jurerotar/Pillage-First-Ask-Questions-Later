CREATE INDEX idx_tiles_rfc_id ON tiles(resource_field_composition_id);

CREATE INDEX idx_tiles_type_xy ON tiles(type, x, y);
