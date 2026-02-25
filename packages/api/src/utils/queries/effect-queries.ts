export const selectAllRelevantEffectsQuery = `
  SELECT
    ei.effect AS id,
    e.value,
    e.type,
    e.scope,
    e.source,
    e.village_id AS villageId,
    e.source_specifier AS sourceSpecifier,
    CASE
      WHEN e.source = 'building'
        THEN bi.building
      END AS buildingId
  FROM
    effects AS e
      LEFT JOIN effect_ids AS ei
                ON ei.id = e.effect_id
      LEFT JOIN building_fields AS bf
                ON e.scope = 'village'
                  AND bf.village_id = e.village_id
                  AND bf.field_id = e.source_specifier
      LEFT JOIN building_ids AS bi
                ON bi.id = bf.building_id
  WHERE
    e.scope IN ('global', 'server')
    OR e.village_id = $village_id;
`;

export const selectAllRelevantEffectsByIdQuery = `
  SELECT
    ei.effect AS id,
    e.value,
    e.type,
    e.scope,
    e.source,
    e.village_id AS villageId,
    e.source_specifier AS sourceSpecifier,
    CASE
      WHEN e.source = 'building'
        AND e.source_specifier BETWEEN 1 AND 40
        THEN bi.building
      END AS buildingId
  FROM
    effects AS e
      LEFT JOIN effect_ids AS ei
                ON ei.id = e.effect_id
      LEFT JOIN building_fields AS bf
                ON e.scope = 'village'
                  AND bf.village_id = e.village_id
                  AND bf.field_id = e.source_specifier
      LEFT JOIN building_ids AS bi
                ON bi.id = bf.building_id
  WHERE
    (ei.effect = $effect_id)
    AND (e.scope IN ('global', 'server') OR e.village_id = $village_id);
`;

export const updatePopulationEffectQuery = `
  UPDATE effects
  SET
    value = value - ($value)
  WHERE
    effect_id = (
      SELECT id
      FROM
        effect_ids
      WHERE
        effect = 'wheatProduction'
      )
    AND type = 'base'
    AND scope = 'village'
    AND source = 'building'
    AND village_id = $village_id
    AND source_specifier = 0;
`;

export const updateBuildingEffectQuery = `
  UPDATE effects
  SET
    value = $value
  WHERE
    effect_id = (
      SELECT id
      FROM
        effect_ids
      WHERE
        effect = $effect_id
      )
    AND village_id = $village_id
    AND type = $type
    AND scope = 'village'
    AND source = 'building'
    AND source_specifier = $source_specifier;
`;

export const deleteHeroEffectsQuery = `
  DELETE
  FROM
    effects
  WHERE
    source = 'hero'
    AND village_id = (
      SELECT village_id
      FROM heroes
      WHERE player_id = $playerId
      );
`;

export const insertHeroEffectsQuery = `
  INSERT INTO effects (village_id, effect_id, value, type, scope, source, source_specifier)
  SELECT
    h.village_id,
    ei.id,
    CASE
      WHEN LOWER(ti.tribe) = 'egyptians' THEN 12 * hsa.resource_production
      ELSE 9 * hsa.resource_production
    END,
    'base',
    'village',
    'hero',
    0
  FROM
    heroes AS h
      JOIN hero_selectable_attributes AS hsa ON h.id = hsa.hero_id
      JOIN players AS p ON h.player_id = p.id
      JOIN tribe_ids AS ti ON p.tribe_id = ti.id
      CROSS JOIN effect_ids AS ei
  WHERE
    h.player_id = $playerId
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
    village_id = $targetId
  WHERE
    source = 'hero'
    AND village_id = (
      SELECT village_id
      FROM
        heroes
      WHERE
        player_id = $playerId
      );
`;
