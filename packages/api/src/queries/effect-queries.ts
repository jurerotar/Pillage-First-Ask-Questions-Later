// Filter effect names after selecting tile-local rows; keep global/server scope lookups separate.
export const selectAllRelevantEffectsQuery = `
  WITH relevant_effects AS (
    SELECT * FROM effects
    WHERE tile_id = $tile_id
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids)
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'global')
      AND tile_id IS NOT $tile_id
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids)
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'server')
      AND tile_id IS NOT $tile_id
  )
  SELECT ei.effect AS id, e.value, et.type, es.scope, eso.source,
    e.tile_id AS tileId, e.source_specifier AS sourceSpecifier
  FROM relevant_effects e
    CROSS JOIN effect_ids ei ON ei.id = e.effect_id
    JOIN effect_type_ids et ON et.id = e.type_id
    JOIN effect_scope_ids es ON es.id = e.scope_id
    JOIN effect_source_ids eso ON eso.id = e.source_id;
`;

export const selectResourceSiteResourcesRelevantEffectsByTileIdQuery = `
  WITH relevant_effects AS (
    SELECT * FROM effects
    WHERE tile_id = $tile_id
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect IN ('warehouseCapacity', 'granaryCapacity', 'woodProduction',
      'clayProduction', 'ironProduction', 'wheatProduction', 'unitWheatConsumption'))
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'global')
      AND tile_id IS NOT $tile_id
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect IN ('warehouseCapacity', 'granaryCapacity', 'woodProduction',
      'clayProduction', 'ironProduction', 'wheatProduction', 'unitWheatConsumption'))
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'server')
      AND tile_id IS NOT $tile_id
  )
  SELECT json_group_array(json_object(
    'id', ei.effect,
    'value', e.value,
    'type', et.type,
    'scope', es.scope,
    'source', eso.source,
    'tileId', e.tile_id,
    'sourceSpecifier', e.source_specifier
  ))
  FROM relevant_effects e
    CROSS JOIN effect_ids ei ON ei.id = e.effect_id
    JOIN effect_type_ids et ON et.id = e.type_id
    JOIN effect_scope_ids es ON es.id = e.scope_id
    JOIN effect_source_ids eso ON eso.id = e.source_id
  WHERE ei.effect IN ('warehouseCapacity', 'granaryCapacity', 'woodProduction',
      'clayProduction', 'ironProduction', 'wheatProduction', 'unitWheatConsumption');
`;

export const selectAllRelevantEffectsByIdQuery = `
  WITH relevant_effects AS (
    SELECT * FROM effects
    WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect = $effect_id)
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'global')
      AND tile_id IS NOT (SELECT tile_id FROM villages WHERE id = $village_id)
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect = $effect_id)
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'server')
      AND tile_id IS NOT (SELECT tile_id FROM villages WHERE id = $village_id)
  )
  SELECT ei.effect AS id, e.value, et.type, es.scope, eso.source,
    e.tile_id AS tileId, e.source_specifier AS sourceSpecifier
  FROM relevant_effects e
    CROSS JOIN effect_ids ei ON ei.id = e.effect_id
    JOIN effect_type_ids et ON et.id = e.type_id
    JOIN effect_scope_ids es ON es.id = e.scope_id
    JOIN effect_source_ids eso ON eso.id = e.source_id
  WHERE ei.effect = $effect_id;
`;

export const selectUnitSpeedRelevantEffectsQuery = `
  WITH relevant_effects AS (
    SELECT * FROM effects
    WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect IN ('unitSpeed', 'unitSpeedAfter20Fields'))
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'global')
      AND tile_id IS NOT (SELECT tile_id FROM villages WHERE id = $village_id)
    UNION ALL
    SELECT * FROM effects
    WHERE effect_id IN (SELECT id FROM effect_ids WHERE effect IN ('unitSpeed', 'unitSpeedAfter20Fields'))
      AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'server')
      AND tile_id IS NOT (SELECT tile_id FROM villages WHERE id = $village_id)
  )
  SELECT ei.effect AS id, e.value, et.type, es.scope, eso.source,
    e.tile_id AS tileId, e.source_specifier AS sourceSpecifier
  FROM relevant_effects e
    CROSS JOIN effect_ids ei ON ei.id = e.effect_id
    JOIN effect_type_ids et ON et.id = e.type_id
    JOIN effect_scope_ids es ON es.id = e.scope_id
    JOIN effect_source_ids eso ON eso.id = e.source_id
  WHERE ei.effect IN ('unitSpeed', 'unitSpeedAfter20Fields');
`;

export const selectWheatProductionEffectIdQuery = `
  SELECT id FROM effect_ids WHERE effect = 'wheatProduction';
`;

export const insertEffectQuery = `
  INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
  VALUES (
    $effect_id,
    $value,
    (SELECT id FROM effect_type_ids WHERE type = $type),
    (SELECT id FROM effect_scope_ids WHERE scope = $scope),
    (SELECT id FROM effect_source_ids WHERE source = $source),
    $tile_id,
    $source_specifier
  );
`;

export const insertEffectByEffectNameQuery = `
  INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
  VALUES (
    (
      SELECT id
      FROM
        effect_ids
      WHERE
        effect = $effect_name
    ),
    $value,
    (SELECT id FROM effect_type_ids WHERE type = $type),
    (SELECT id FROM effect_scope_ids WHERE scope = $scope),
    (SELECT id FROM effect_source_ids WHERE source = $source),
    $tile_id,
    $source_specifier
  );
`;

export const updatePopulationEffectQuery = `
  UPDATE effects
  SET
    value = value - ($value)
  FROM effect_ids ei
  WHERE
    effects.effect_id = ei.id
    AND ei.effect = 'wheatProduction'
    AND type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
    AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
    AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    AND source_specifier = 0;
`;

export const updateBuildingEffectQuery = `
  UPDATE effects
  SET
    value = $value
  FROM effect_ids ei
  WHERE
    effects.effect_id = ei.id
    AND ei.effect = $effect_id
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    AND type_id = (SELECT id FROM effect_type_ids WHERE type = $type)
    AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
    AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
    AND source_specifier = $source_specifier;
`;

export const deleteHeroEffectsQuery = `
  DELETE
  FROM
    effects
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero')
    AND tile_id IN (
      SELECT villages.tile_id
      FROM
        heroes
        JOIN villages ON villages.id = heroes.village_id
      WHERE
        heroes.player_id = $player_id
      );
`;

export const insertHeroEffectsQuery = `
  INSERT INTO effects (tile_id, effect_id, value, type_id, scope_id, source_id, source_specifier)
  SELECT
    v.tile_id,
    ei.id,
    CASE
      WHEN LOWER(ti.tribe) = 'egyptians' THEN 12 * hsa.resource_production
      ELSE 9 * hsa.resource_production
    END,
    1,
    2,
    2,
    0
  FROM
    heroes AS h
      JOIN villages AS v ON v.id = h.village_id
      JOIN hero_selectable_attributes AS hsa ON h.id = hsa.hero_id
      JOIN players AS p ON h.player_id = p.id
      JOIN tribe_ids AS ti ON p.tribe_id = ti.id
      CROSS JOIN effect_ids AS ei
  WHERE
    h.player_id = $player_id
    AND ei.effect IN (
      'woodProduction',
      'clayProduction',
      'ironProduction',
      'wheatProduction'
    );
`;

export const updateHeroEffectsVillageIdQuery = `
  UPDATE effects
  SET
    tile_id = (SELECT tile_id FROM villages WHERE id = $targetId)
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero')
    AND EXISTS (
      SELECT
        1
      FROM
        heroes
        JOIN villages ON villages.id = heroes.village_id
      WHERE
        villages.tile_id = effects.tile_id
        AND heroes.player_id = $player_id
      );
`;

export const updateHeroResourceProductionEffectQuery = `
  UPDATE effects
  SET
    value = $value
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero')
    AND source_specifier = 0
    AND effect_id = (
      SELECT id
      FROM
        effect_ids
      WHERE
        effect = $effect_id
    )
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
`;

export const updateHeroVillageEffectsByVillageIdQuery = `
  UPDATE effects
  SET tile_id = (SELECT tile_id FROM villages WHERE id = $target_village_id)
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero')
    AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $current_village_id);
`;

export const updateWheatProductionByTroopsAndTileIdEffectQuery = `
  UPDATE effects
  SET
    value = value + $increase_amount
  WHERE
    -- Check the name for tile-local candidates rather than searching every tile by effect_id.
    EXISTS (
      SELECT 1
      FROM
        effect_ids
      WHERE
        id = effects.effect_id
        AND effect = 'wheatProduction'
    )
    AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
    AND tile_id = $tile_id;
`;
