CREATE INDEX idx_effects_effect_id ON effects(effect_id);
CREATE INDEX idx_effects_tile_id ON effects(tile_id);
CREATE INDEX idx_effects_tile_effect_scope_spec
  ON effects(effect_id, tile_id, scope_id, source_specifier);
CREATE INDEX idx_effects_resource_tile
  ON effects(tile_id, effect_id, scope_id)
  WHERE tile_id IS NOT NULL;

-- Population effect index
-- SQLite partial-index predicates cannot contain subqueries. scope_id = 2 is the stable id for 'local'.
CREATE INDEX IF NOT EXISTS idx_effects_wheat_effect_tile_value
  ON effects(effect_id, tile_id, value)
  WHERE scope_id = 2 AND source_specifier = 0 AND effect_id = 1;
