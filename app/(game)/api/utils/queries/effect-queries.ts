export const selectAllRelevantEffectsQuery = `
  SELECT
    ei.effect AS id,
    e.value,
    e.type,
    e.scope,
    e.source,
    e.village_id AS villageId,
    e.source_specifier,
    CASE
      WHEN e.source = 'building'
        THEN bf.building_id
      END AS buildingId
  FROM
    effects AS e
      LEFT JOIN effect_ids AS ei
                ON ei.id = e.effect_id
      LEFT JOIN building_fields AS bf
                ON e.scope = 'village'
                  AND bf.village_id = e.village_id
                  AND bf.field_id = e.source_specifier
  WHERE
    e.scope IN ('global', 'server')
    OR e.village_id = $village_id;
`;

export const selectAllRelevantEffectsByIdQuery = `
  SELECT ei.effect AS id,
         e.value,
         e.type,
         e.scope,
         e.source,
         e.village_id AS villageId,
         e.source_specifier,
         CASE
           WHEN e.source = 'building'
             AND e.source_specifier BETWEEN 1 AND 40
             THEN bf.building_id
           END AS buildingId
  FROM effects AS e
         LEFT JOIN effect_ids AS ei
                   ON ei.id = e.effect_id
         LEFT JOIN building_fields AS bf
                   ON e.scope = 'village'
                     AND bf.village_id = e.village_id
                     AND bf.field_id = e.source_specifier
  WHERE (ei.effect = $effect_id)
    AND (e.scope IN ('global', 'server') OR e.village_id = $village_id);
`;

export const updatePopulationEffectQuery = `
  UPDATE effects
  SET value = value - ($value)
  WHERE effect_id = (SELECT id
         FROM effect_ids
         WHERE effect = 'wheatProduction')
    AND type = 'base'
    AND scope = 'village'
    AND source = 'building'
    AND village_id = $village_id
    AND source_specifier = 0;
`;

export const updateBuildingEffectQuery = `
  UPDATE effects
  SET value = $value
  WHERE effect_id = (SELECT id FROM effect_ids WHERE effect = $effect_id)
    AND village_id = $village_id
    AND type = 'base'
    AND scope = 'village'
    AND source = 'building'
    AND source_specifier = $source_specifier;
`;
