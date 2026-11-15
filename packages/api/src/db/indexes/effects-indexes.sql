-- General tile-scoped lookups and cleanup/update paths that target all effects on a tile.
CREATE INDEX idx_effects_tile_id ON effects(tile_id);

-- Building-effect updates by effect + tile + scope + field/source specifier.
CREATE INDEX idx_effects_tile_effect_scope_spec
  ON effects(effect_id, tile_id, scope_id, source_specifier);

-- Hot resource-site resource calculation query. Covers effect filtering plus returned scalar columns
-- for selectResourceSiteResourcesRelevantEffectsByTileIdQuery.
CREATE INDEX idx_effects_resource_site_resources
  ON effects(effect_id, scope_id, tile_id, source_specifier, source_id, type_id, value);
