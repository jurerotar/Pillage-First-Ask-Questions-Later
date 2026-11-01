export const deleteMapMarkerQuery = `
  DELETE
  FROM
    map_markers
  WHERE
    player_id = $player_id
    AND tile_id = $tile_id;
`;

export const selectPlayerMapMarkersQuery = `
  SELECT
    tile_id,
    CASE
      WHEN TRIM(description) = '' THEN 'Map marker ' || ROW_NUMBER() OVER (ORDER BY id)
      ELSE description
      END AS description,
    color,
    icon
  FROM
    map_markers
  WHERE
    player_id = $player_id
  ORDER BY
    id;
`;

export const insertMapMarkerQuery = `
  INSERT INTO
    map_markers (player_id, tile_id, description, color, icon)
  VALUES
    ($player_id, $tile_id, $description, $color, $icon);
`;

export const selectVillageAndFirstOasisTileIdsQuery = `
  SELECT
    v.tile_id AS villageTileId,
    (
      SELECT tile_id
      FROM
        oasis
      ORDER BY id
      LIMIT 1
    ) AS sourceTileId
  FROM
    villages v
  WHERE
    v.id = $village_id;
`;

export const selectMapTilesQuery = `
  WITH
    village_details AS MATERIALIZED (
      SELECT
        v.id,
        v.tile_id,
        v.name,
        v.slug,
        p.id AS player_id,
        p.slug AS player_slug,
        p.name AS player_name,
        ti.tribe AS player_tribe,
        fi.faction AS player_faction,
        COALESCE((
          SELECT SUM(-e.value)
          FROM effects e
          WHERE e.tile_id = v.tile_id
            AND e.effect_id = 1
            AND e.type_id = 1
            AND e.scope_id = 2
            AND e.source_id = 1
            AND e.source_specifier = 0
        ), 0) AS population
      FROM villages v
        LEFT JOIN players p ON p.id = v.player_id
        LEFT JOIN tribe_ids ti ON ti.id = p.tribe_id
        LEFT JOIN faction_ids fi ON fi.id = p.faction_id
    )
  -- Transfer one JSON value instead of reading every column across the WASM boundary.
  SELECT json_group_array(json_object(
    'id', t.id,
    'coordinates_x', t.x,
    'coordinates_y', t.y,
    'type', CASE t.type_id WHEN 1 THEN 'free' WHEN 2 THEN 'oasis' END,
    'rfc', rfc.resource_field_composition,
    'oasis_graphics', t.oasis_graphics,
    'oasis_bonus_type', o.bonus_type,
    'village_id', details.id,
    'village_name', details.name,
    'village_slug', details.slug,
    'player_id', details.player_id,
    'player_slug', details.player_slug,
    'player_name', details.player_name,
    'player_tribe', details.player_tribe,
    'player_faction', details.player_faction,
    'population', details.population
  )) AS tiles_json
  FROM tiles t
      LEFT JOIN (
        SELECT
          tile_id,
          MAX(village_id) AS village_id,
          CASE
            WHEN COUNT(*) = 1 AND MAX(bonus) = 25 THEN 1
            WHEN COUNT(*) = 2 AND MIN(bonus) = 25 AND MAX(bonus) = 25 THEN 2
            WHEN COUNT(*) = 1 AND MAX(bonus) = 50 THEN 3
            ELSE NULL
          END AS bonus_type
        FROM
          oasis
        GROUP BY tile_id
      ) o ON o.tile_id = t.id AND t.type_id = 2
      LEFT JOIN village_details details ON details.tile_id = CASE t.type_id
        WHEN 1 THEN t.id
        WHEN 2 THEN (SELECT tile_id FROM villages WHERE id = o.village_id)
      END
      LEFT JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
  ;
`;

export const selectTileTroopsQuery = `
  SELECT
    ui.unit AS unit_id,
    SUM(t.amount) AS amount,
    t.tile_id,
    t.source_tile_id
  FROM
    troops t
      JOIN unit_ids ui ON ui.id = t.unit_id
  WHERE
    t.tile_id = $tile_id
  GROUP BY
    ui.unit;
`;

export const selectTileOasisBonusesQuery = `
  SELECT
    ri.resource,
    o.bonus
  FROM
    oasis o
      JOIN resource_ids ri ON ri.id = o.resource_id
  WHERE
    o.tile_id = $tile_id;
`;
