CREATE INDEX idx_effects_effect_id   ON effects(effect_id);
CREATE INDEX idx_effects_village_effect_scope_spec
  ON effects(village_id, effect_id, scope, source_specifier);

-- Population effect index
CREATE INDEX IF NOT EXISTS idx_effects_wheat_effect_village_value
  ON effects(effect_id, village_id, value)
  WHERE scope = 'village' AND source_specifier = 0 AND effect_id = 1;
