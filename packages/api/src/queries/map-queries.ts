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
    color
  FROM
    map_markers
  WHERE
    player_id = $player_id
  ORDER BY
    id;
`;

export const insertMapMarkerQuery = `
  INSERT INTO
    map_markers (player_id, tile_id, description, color)
  VALUES
    ($player_id, $tile_id, $description, $color);
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
    effects_wheat AS (
      SELECT e.tile_id, SUM(-e.value) AS wheat_production_sum
      FROM
        effects e
      WHERE
        e.effect_id = 1
        AND e.type_id = 1
        AND e.scope_id = 2
        AND e.source_id = 1
        AND e.source_specifier = 0
      GROUP BY e.tile_id
    ),

    world_items_single AS (
      SELECT tile_id, MIN(item_id) AS item_id
      FROM
        world_items
      GROUP BY tile_id
    )

  SELECT
    t.id AS id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    CASE t.type_id
      WHEN 1 THEN 'free'
      WHEN 2 THEN 'oasis'
    END AS type,
    rfc.resource_field_composition AS rfc,
    t.oasis_graphics AS oasis_graphics,
    CASE
      WHEN t.type_id = 1 THEN v.id
      WHEN t.type_id = 2 THEN v_owner.id
    END AS village_id,
    CASE
      WHEN t.type_id = 1 THEN v.name
      WHEN t.type_id = 2 THEN v_owner.name
    END AS village_name,
    CASE
      WHEN t.type_id = 1 THEN v.slug
      WHEN t.type_id = 2 THEN v_owner.slug
    END AS village_slug,
    p.id AS player_id,
    p.slug AS player_slug,
    p.name AS player_name,
    ti.tribe AS player_tribe,
    fi.faction AS player_faction,

    CASE
      WHEN t.type_id = 1 AND v.id IS NOT NULL THEN COALESCE(ew.wheat_production_sum, 0)
      WHEN t.type_id = 2 AND v_owner.id IS NOT NULL THEN COALESCE(ew_owner.wheat_production_sum, 0)
    END AS population,

    CASE
      WHEN t.type_id = 1 THEN wi.item_id
    END AS item_id,

    CASE
      WHEN t.type_id = 2 THEN 1
      ELSE 0
    END AS oasis_is_occupiable

  FROM
    tiles t
      LEFT JOIN villages v ON v.tile_id = t.id
      LEFT JOIN (
        SELECT tile_id, MAX(village_id) AS village_id
        FROM
          oasis
        GROUP BY tile_id
      ) o ON o.tile_id = t.id AND t.type_id = 2
      LEFT JOIN villages v_owner ON v_owner.id = o.village_id
      LEFT JOIN players p ON p.id = CASE
        WHEN t.type_id = 1 THEN v.player_id
        WHEN t.type_id = 2 THEN v_owner.player_id
      END
      LEFT JOIN tribe_ids ti ON p.tribe_id = ti.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
      LEFT JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
      LEFT JOIN effects_wheat ew ON ew.tile_id = v.tile_id
      LEFT JOIN effects_wheat ew_owner ON ew_owner.tile_id = v_owner.tile_id
      LEFT JOIN world_items_single wi ON wi.tile_id = t.id

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

export const selectTileWorldItemQuery = `
  SELECT item_id, amount
  FROM
    world_items
  WHERE
    tile_id = $tile_id
  LIMIT 1;
`;
