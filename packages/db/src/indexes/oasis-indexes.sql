CREATE INDEX idx_oasis_tile_id ON oasis(tile_id);
CREATE INDEX idx_oasis_village_id ON oasis(village_id);
CREATE INDEX idx_oasis_tile_resource_bonus ON oasis(tile_id, resource, bonus);
CREATE INDEX idx_oasis_resource_bonus_tile_id ON oasis(resource, bonus, tile_id);
