export const occupyOasisQuery = `
  UPDATE oasis
  SET
    village_id = $village_id
  WHERE
    tile_id = $oasis_tile_id;
`;

export const selectOasisOccupationContextQuery = `
  WITH previous_owner AS (
    SELECT MAX(village_id) AS village_id
    FROM
      oasis
    WHERE
      tile_id = $oasis_tile_id
  )
  SELECT
    v.tile_id AS village_tile_id,
    po.village_id AS previous_owner_village_id,
    pv.tile_id AS previous_owner_tile_id
  FROM
    villages v
      CROSS JOIN previous_owner po
      LEFT JOIN villages pv ON pv.id = po.village_id
  WHERE
    v.id = $village_id
  LIMIT 1;
`;

export const insertOasisEffectsForVillageQuery = `
  WITH waterworks_bonus_multiplier(value) AS (
    SELECT
      -- Waterworks adds 5% of the oasis bonus per level. We store that
      -- adjusted value on the oasis effect so computed-effect math stays generic.
      1 + 0.05 * COALESCE(MAX(bf.level), 0)
    FROM
      villages v
        LEFT JOIN building_fields bf ON bf.village_id = v.id
          AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'WATERWORKS')
    WHERE
      v.tile_id = $village_tile_id
  )

  INSERT INTO effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
  SELECT
    ei.id,
    1 + (o.bonus / 100.0) * wbm.value,
    (SELECT id FROM effect_type_ids WHERE type = 'bonus'),
    (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
    (SELECT id FROM effect_source_ids WHERE source = 'oasis'),
    $village_tile_id,
    $oasis_tile_id
  FROM
    oasis o
      JOIN resource_ids ri ON ri.id = o.resource_id
      JOIN effect_ids ei ON ei.effect = ri.resource || 'Production'
      CROSS JOIN waterworks_bonus_multiplier wbm
  WHERE
    o.tile_id = $oasis_tile_id;
`;

export const updateOasisEffectsForVillageQuery = `
  WITH waterworks_bonus_multiplier(value) AS (
    SELECT
      -- Keep existing occupied oasis effects in sync with Waterworks. The
      -- multiplier lives here because Waterworks only affects oasis bonuses.
      1 + 0.05 * COALESCE(MAX(bf.level), 0)
    FROM
      building_fields bf
    WHERE
      bf.village_id = $village_id
      AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'WATERWORKS')
  )

  UPDATE effects
  SET
    value = 1 + (o.bonus / 100.0) * wbm.value
  FROM
    oasis o
      JOIN resource_ids ri ON ri.id = o.resource_id
      JOIN effect_ids ei ON ei.effect = ri.resource || 'Production'
      CROSS JOIN waterworks_bonus_multiplier wbm
  WHERE
    effects.effect_id = ei.id
    AND effects.type_id = (SELECT id FROM effect_type_ids WHERE type = 'bonus')
    AND effects.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
    AND effects.source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
    AND effects.tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    AND effects.source_specifier = o.tile_id;
`;

export const deleteOasisEffectsQuery = `
  DELETE
  FROM
    effects
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    AND source_specifier = $source_specifier;
`;

export const deleteOasisEffectsByTileIdQuery = `
  DELETE
  FROM
    effects
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
    AND tile_id = $tile_id
    AND source_specifier = $source_specifier;
`;

export const selectOasisReinforcementsToReturnQuery = `
  SELECT
    ui.unit AS unit_id,
    t.amount,
    t.source_tile_id,
    sv.id AS source_village_id
  FROM
    troops t
      JOIN unit_ids ui ON ui.id = t.unit_id
      LEFT JOIN villages sv ON sv.tile_id = t.source_tile_id
  WHERE
    t.tile_id = $oasis_tile_id
    AND t.source_tile_id != $oasis_tile_id
    AND EXISTS (
      SELECT 1
      FROM
        oasis o
      WHERE
        o.tile_id = t.tile_id
        AND o.village_id = $village_id
    )
  ORDER BY
    t.source_tile_id,
    ui.id;
`;

export const abandonOasisQuery = `
  UPDATE oasis
  SET
    village_id = NULL
  WHERE
    tile_id = $oasis_tile_id
    AND village_id = $village_id;
`;
