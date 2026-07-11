CREATE INDEX idx_trapper_cages_village_id ON trapper_cages (village_id);

CREATE INDEX idx_trapper_cages_village_id_unit_id ON trapper_cages (village_id, unit_id);
