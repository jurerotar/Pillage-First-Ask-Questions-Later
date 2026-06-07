export const updateResourceSiteResourcesByVillageIdQuery = `
  UPDATE resource_sites
  SET
    wood = $wood,
    clay = $clay,
    iron = $iron,
    wheat = $wheat,
    updated_at = $updated_at
  WHERE
    tile_id = (
      SELECT tile_id
      FROM
        villages
      WHERE
        id = $village_id
      );
`;

export const selectVillageBySlugQuery = `
  SELECT
    v.id,
    v.tile_id,
    v.player_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    v.name,
    v.slug,
    rs.updated_at AS last_updated_at,
    rs.wood AS wood,
    rs.clay AS clay,
    rs.iron AS iron,
    rs.wheat AS wheat,
    rfc.resource_field_composition AS resource_field_composition,
    (
      SELECT
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'field_id', bf.field_id,
            'building_id', bi.building,
            'level', bf.level
          )
        )
      FROM
        building_fields bf
          LEFT JOIN building_ids bi ON bi.id = bf.building_id
      WHERE
        bf.village_id = v.id
    ) AS building_fields
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN resource_sites rs ON rs.tile_id = v.tile_id
      LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
  WHERE
    v.slug = $slug
  LIMIT 1;
`;

export const selectVillageTileIdQuery = `
  SELECT tile_id
  FROM
    villages
  WHERE
    id = $village_id;
`;

export const selectOccupiableOasisInRangeQuery = `
  WITH
    src_village AS (
      SELECT t.id AS vtile, t.x AS vx, t.y AS vy
      FROM
        villages v
          JOIN tiles t ON t.id = v.tile_id
      WHERE
        v.id = $village_id
      LIMIT 1
    ),

    oasis_agg AS (
      SELECT
        ot.id AS tile_id,
        ot.x AS x,
        ot.y AS y,
        ot.oasis_graphics AS oasis_graphics,
        JSON_GROUP_ARRAY(o.bonus) AS bonuses_json,
        MAX(o.village_id) AS occupying_village_id
      FROM
        tiles ot
          JOIN src_village sv ON 1 = 1
          JOIN oasis o ON o.tile_id = ot.id
      WHERE
        ot.type = 'oasis'
        AND ot.x BETWEEN sv.vx - $radius AND sv.vx + $radius
        AND ot.y BETWEEN sv.vy - $radius AND sv.vy + $radius
      GROUP BY ot.id
    )

  SELECT
    oa.tile_id,
    oa.x AS tile_coordinates_x,
    oa.y AS tile_coordinates_y,
    oa.oasis_graphics,
    oa.bonuses_json,
    oa.occupying_village_id,
    v2.name AS occupying_village_name,
    v2.slug AS occupying_village_slug,
    vt2.x AS occupying_village_coordinates_x,
    vt2.y AS occupying_village_coordinates_y,
    p.id AS occupying_player_id,
    p.name AS occupying_player_name,
    p.slug AS occupying_player_slug
  FROM
    oasis_agg oa
      CROSS JOIN src_village sv
      LEFT JOIN villages v2 ON v2.id = oa.occupying_village_id
      LEFT JOIN tiles vt2 ON vt2.id = v2.tile_id
      LEFT JOIN players p ON p.id = v2.player_id
  ORDER BY
    (ABS(oa.x - sv.vx) + ABS(oa.y - sv.vy)),
    oa.tile_id;
`;

export const selectVillageBuildingLevelQuery = `
  SELECT MAX(bf.level) AS level
  FROM
    building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
  WHERE
    bf.village_id = $village_id
    AND bi.building = $building_id
    AND bf.level > 0;
`;

export const dropRearrangeSourceFieldsTableQuery = `
  DROP TABLE IF EXISTS temp_rearrange_source_fields;
`;

export const createRearrangeSourceFieldsTableQuery = `
  CREATE TEMP TABLE temp_rearrange_source_fields AS
  SELECT bf.field_id, bf.building_id, bi.building AS building_text, bf.level
  FROM
    building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
  WHERE
    bf.village_id = $village_id
    AND bf.field_id BETWEEN 19 AND 38
    AND bf.building_id IS NOT NULL;
`;

export const deleteRearrangedBuildingFieldsQuery = `
  WITH updates_raw(field_id, building_text) AS (
    SELECT CAST(value ->> '$.buildingFieldId' AS INTEGER), value ->> '$.buildingId'
    FROM JSON_EACH($updates)
  ),
  updates AS (
    SELECT ur.field_id
    FROM updates_raw ur
    WHERE ur.field_id BETWEEN 19 AND 38
  )
  DELETE
  FROM
    building_fields
  WHERE
    village_id = $village_id
    AND EXISTS (
      SELECT 1
      FROM updates u
      WHERE u.field_id = building_fields.field_id
    );
`;

export const insertRearrangedBuildingFieldsQuery = `
  WITH updates_raw(field_id, building_text) AS (
    SELECT CAST(value ->> '$.buildingFieldId' AS INTEGER), value ->> '$.buildingId'
    FROM JSON_EACH($updates)
  ),
  updates AS (
    SELECT ur.field_id, bi.id AS building_id
    FROM updates_raw ur
    LEFT JOIN building_ids bi ON bi.building = ur.building_text
    WHERE ur.field_id BETWEEN 19 AND 38
  ),
  new_occupied_state AS (
    SELECT
      u.field_id,
      u.building_id,
      COALESCE(
        (
          SELECT sf.level
          FROM temp_rearrange_source_fields sf
          WHERE sf.building_id = u.building_id
            AND EXISTS (
              SELECT 1
              FROM updates source_update
              WHERE source_update.field_id = sf.field_id
                AND (
                  source_update.building_id IS NULL
                  OR source_update.building_id <> sf.building_id
                )
            )
          LIMIT 1
        ),
        (
          SELECT sf.level
          FROM temp_rearrange_source_fields sf
          WHERE sf.field_id = u.field_id
            AND sf.building_id = u.building_id
          LIMIT 1
        ),
        0
      ) as level
    FROM updates u
    WHERE u.building_id IS NOT NULL
  )
  INSERT INTO building_fields (village_id, field_id, building_id, level)
  SELECT $village_id, field_id, building_id, level
  FROM new_occupied_state;
`;

export const updateRearrangedBuildingFieldEventsQuery = `
  WITH updates_raw(field_id, building_text) AS (
    SELECT CAST(value ->> '$.buildingFieldId' AS INTEGER), value ->> '$.buildingId'
    FROM JSON_EACH($updates)
    WHERE CAST(value ->> '$.buildingFieldId' AS INTEGER) BETWEEN 19 AND 38
  )
  UPDATE events
  SET
    meta = JSON_SET(meta, '$.buildingFieldId', ur.field_id)
  FROM updates_raw ur
  WHERE
    events.village_id = $village_id
    AND events.type IN ('buildingScheduledConstruction', 'buildingConstruction', 'buildingLevelChange', 'buildingDestruction')
    AND JSON_EXTRACT(meta, '$.buildingId') = ur.building_text
    AND ur.building_text IS NOT NULL;
`;
