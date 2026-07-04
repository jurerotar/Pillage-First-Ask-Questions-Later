export const selectPlayerByIdQuery = `
  SELECT
    p.id,
    p.name,
    p.slug,
    ti.tribe,
    fi.faction AS faction
  FROM
    players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
  WHERE
    p.id = $player_id;
`;

export const selectPlayerVillageListingQuery = `
  SELECT
    v.id,
    v.tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    v.name,
    v.slug,
    rfc.resource_field_composition AS resource_field_composition
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
  WHERE
    v.player_id = $player_id;
`;

export const selectPlayerVillagesWithPopulationQuery = `
  SELECT
    v.id,
    v.tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    v.name,
    v.slug,
    rfc.resource_field_composition AS resource_field_composition,
    COALESCE(SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END), 0) AS population
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
      LEFT JOIN effects e ON e.village_id = v.id
        AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
        AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
        AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
        AND e.source_specifier = 0
      LEFT JOIN effect_ids ei ON ei.id = e.effect_id
  WHERE
    v.player_id = $player_id
  GROUP BY
    v.id, v.tile_id, t.x, t.y, v.name, v.slug, rfc.resource_field_composition
  ORDER BY
    population DESC;
`;

export const selectStationedTroopsByTileQuery = `
  SELECT
    ui.unit AS unit_id,
    t.amount,
    t.tile_id,
    t.source_tile_id,
    source_tt.type AS source_tile_type
  FROM
    troops t
      LEFT JOIN tiles source_t ON source_t.id = t.source_tile_id
      LEFT JOIN tile_type_ids source_tt ON source_tt.id = source_t.type_id
      JOIN unit_ids ui ON ui.id = t.unit_id
  WHERE
    t.tile_id = $tile_id;
`;

export const updateVillageNameQuery = `
  UPDATE villages
  SET
    name = $name
  WHERE
    id = $village_id;
`;

export const selectPlayerBySlugQuery = `
  SELECT
    p.id,
    p.name,
    p.slug,
    ti.tribe,
    fi.faction
  FROM
    players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      JOIN villages v ON v.player_id = p.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
  WHERE
    p.slug = $player_slug
  LIMIT 1;
`;

export const selectSentReinforcementsByTileQuery = `
  SELECT
    CASE
      WHEN v.id IS NOT NULL THEN v.id
      ELSE ov.id
    END AS village_id,
    CASE
      WHEN v.id IS NOT NULL THEN 'village'
      ELSE 'oasis'
    END AS target_type,
    tr.tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    CASE
      WHEN v.id IS NOT NULL THEN v.name
      ELSE 'Oasis'
    END AS name,
    CASE
      WHEN v.id IS NOT NULL THEN v.slug
      ELSE ov.slug
    END AS slug,
    CASE
      WHEN v.id IS NOT NULL THEN rfc.resource_field_composition
      ELSE owner_rfc.resource_field_composition
    END AS resource_field_composition,
    ui.unit AS unit_id,
    tr.amount,
    tr.source_tile_id,
    source_tt.type AS source_tile_type
  FROM
    troops tr
      JOIN tiles t
           ON t.id = tr.tile_id
      LEFT JOIN tiles source_t
           ON source_t.id = tr.source_tile_id
      LEFT JOIN tile_type_ids source_tt
           ON source_tt.id = source_t.type_id
      LEFT JOIN villages v
           ON v.tile_id = tr.tile_id
      LEFT JOIN villages ov
           ON ov.id = (
             SELECT MAX(o.village_id)
             FROM
               oasis o
             WHERE
               o.tile_id = tr.tile_id
           )
      LEFT JOIN resource_field_composition_ids rfc
                ON t.resource_field_composition_id = rfc.id
      LEFT JOIN tiles owner_t
                ON owner_t.id = ov.tile_id
      LEFT JOIN resource_field_composition_ids owner_rfc
                ON owner_t.resource_field_composition_id = owner_rfc.id
      JOIN unit_ids ui
           ON ui.id = tr.unit_id
  WHERE
    tr.source_tile_id = $tile_id
    AND tr.tile_id != $tile_id
    AND (v.id IS NOT NULL OR ov.id IS NOT NULL)
  ORDER BY
    name,
    tr.tile_id,
    ui.id;
`;

export const selectSourceVillageByTileAndCurrentTileQuery = `
  SELECT
    CASE
      WHEN stt.type = 'free' THEN sv.id
      WHEN stt.type = 'oasis' THEN (
        SELECT MAX(so.village_id)
        FROM
          oasis so
        WHERE
          so.tile_id = $source_tile_id
      )
    END AS sourceVillageId,
    stt.type AS sourceTileType,
    cv.id AS currentVillageId,
    cv.tile_id AS currentTileId
  FROM villages cv
    LEFT JOIN tiles st ON st.id = $source_tile_id
    LEFT JOIN tile_type_ids stt ON stt.id = st.type_id
    LEFT JOIN villages sv ON sv.tile_id = $source_tile_id
  WHERE cv.tile_id = $current_tile_id;
`;

export const selectStationedVillageByTileAndCurrentTileQuery = `
  SELECT
    cv.id AS currentVillageId,
    cv.tile_id AS currentTileId,
    stt.type AS stationedTileType,
    CASE
      WHEN stt.type = 'free' THEN sv.id
      WHEN stt.type = 'oasis' THEN (
        SELECT MAX(so.village_id)
        FROM
          oasis so
        WHERE
          so.tile_id = $stationed_tile_id
      )
    END AS stationedVillageId
  FROM villages cv
    LEFT JOIN tiles st ON st.id = $stationed_tile_id
    LEFT JOIN tile_type_ids stt ON stt.id = st.type_id
    LEFT JOIN villages sv ON sv.tile_id = $stationed_tile_id
  WHERE cv.tile_id = $current_tile_id;
`;

export const selectTileCoordinatesQuery = `
  SELECT x, y
  FROM tiles
  WHERE id = $tile_id;
`;

export const selectTroopAmountQuery = `
  SELECT amount
  FROM troops
  WHERE
    unit_id = (
      SELECT id
      FROM unit_ids
      WHERE unit = $unit_id
    )
    AND tile_id = $tile_id
    AND source_tile_id = $source_tile_id;
`;
