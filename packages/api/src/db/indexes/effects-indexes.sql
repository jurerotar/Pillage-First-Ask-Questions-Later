-- Tile-scoped cleanup and updates, including hero and troop effects.
CREATE INDEX idx_effects_tile_id ON effects(tile_id, source_id);

-- Covers tile-local reads and narrows building-effect updates to the field.
CREATE INDEX idx_effects_tile_effect_scope_spec
  ON effects(tile_id, effect_id, scope_id, source_specifier, source_id, type_id, value);

-- Nonlocal reads can seek directly to global/server scopes and effect IDs.
CREATE INDEX idx_effects_resource_site_resources
  ON effects(scope_id, effect_id, tile_id);
