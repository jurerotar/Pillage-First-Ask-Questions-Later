export const selectTilesByResourceFieldCompositionQuery = `
  SELECT
    t.id AS tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    rfc.resource_field_composition AS resource_field_composition,
    v.id AS owner_village_id,
    v.name AS owner_village_name,
    v.slug AS owner_village_slug,
    t.x AS owner_village_x,
    t.y AS owner_village_y,
    ((t.x - $tile_x) * (t.x - $tile_x) + (t.y - $tile_y) * (t.y - $tile_y)) AS distance_squared
  FROM tiles t
  LEFT JOIN resource_field_composition_ids rfc
    ON rfc.id = t.resource_field_composition_id
  LEFT JOIN villages v ON v.tile_id = t.id
  WHERE
    -- Verify each composition match's type without walking the type/coordinate index.
    EXISTS (
      SELECT 1 FROM tile_type_ids tt
      WHERE tt.id = t.type_id AND tt.type = 'free'
    )
    AND ($show_occupied_tiles = 1 OR v.id IS NULL)
    AND t.resource_field_composition_id IN (
      SELECT id
      FROM resource_field_composition_ids
      WHERE ($rfc_param = 'any-cropper'
        AND resource_field_composition IN ('3339', '11115', '00018'))
        OR resource_field_composition = $rfc_param
    )
  ORDER BY distance_squared ASC;
`;

export const selectOccupiableOasesQuery = `
  SELECT
    o.tile_id AS oasis_tile_id,
    ot.x AS oasis_x,
    ot.y AS oasis_y,
    COALESCE(
      MAX(CASE WHEN ri.resource <> 'wheat' THEN ri.resource END),
      MAX(ri.resource)
    ) AS resource,
    CASE
      WHEN COUNT(*) = 1 AND MAX(o.bonus) = 25 THEN 1
      WHEN COUNT(*) = 2 AND MIN(o.bonus) = 25 AND MAX(o.bonus) = 25 THEN 2
      WHEN COUNT(*) = 1 AND MAX(o.bonus) = 50 THEN 3
      ELSE NULL
    END AS bonus_type,
    MAX(CASE WHEN o.village_id IS NOT NULL THEN 1 ELSE 0 END) AS is_occupied
  FROM oasis o
  JOIN tiles ot ON ot.id = o.tile_id
  JOIN resource_ids ri ON ri.id = o.resource_id
  GROUP BY o.tile_id
  ORDER BY o.tile_id;
`;

export const selectTilesByOasisBonusesQuery = `
  WITH
    requested_slot_bonuses AS MATERIALIZED (
      SELECT
        CAST(key AS INTEGER) AS request_id,
        CAST(JSON_EXTRACT(value, '$.slot') AS INTEGER) AS slot_index,
        JSON_EXTRACT(value, '$.resource') AS resource,
        CAST(JSON_EXTRACT(value, '$.bonus') AS INTEGER) AS bonus
      FROM JSON_EACH($requested_slot_bonuses)
    ),
    slot_bonus_counts AS (
      SELECT
        slot_index,
        COUNT(*) AS required_bonus_count
      FROM requested_slot_bonuses
      GROUP BY slot_index
    ),
    ranked_slots AS (
      SELECT
        slot_index,
        ROW_NUMBER() OVER (ORDER BY slot_index) AS slot_rank
      FROM slot_bonus_counts
    ),
    active_slot_count AS (
      SELECT COUNT(*) AS value
      FROM slot_bonus_counts
    ),
    -- Skip the map scan when no slot bonuses were requested.
    active_requests AS MATERIALIZED (
      SELECT 1 FROM requested_slot_bonuses LIMIT 1
    ),
    candidates AS MATERIALIZED (
      SELECT
        t.id,
        t.x,
        t.y,
        rfc.resource_field_composition,
        v.id AS owner_village_id,
        v.name AS owner_village_name,
        v.slug AS owner_village_slug
      FROM active_requests
      CROSS JOIN tiles t
      LEFT JOIN resource_field_composition_ids rfc
        ON rfc.id = t.resource_field_composition_id
      LEFT JOIN villages v ON v.tile_id = t.id
      WHERE
        EXISTS (
          SELECT 1 FROM tile_type_ids tt
          WHERE tt.id = t.type_id AND tt.type = 'free'
        )
        AND ($show_occupied_tiles = 1 OR v.id IS NULL)
        AND t.resource_field_composition_id IN (
          SELECT id
          FROM resource_field_composition_ids
          WHERE ($rfc_param = 'any-cropper'
            AND resource_field_composition IN ('3339', '11115', '00018'))
            OR resource_field_composition = $rfc_param
        )
    ),
    slot_matches AS (
      SELECT
        c.id AS candidate_tile,
        rsb.slot_index,
        o.tile_id AS oasis_tile
      FROM candidates c
      -- Keep each candidate outermost, then seek seven X values and a Y range
      -- through the existing coordinate index. Coordinates are integers.
      CROSS JOIN tiles ot
        ON ot.x IN (c.x - 3, c.x - 2, c.x - 1, c.x, c.x + 1, c.x + 2, c.x + 3)
        AND ot.y BETWEEN c.y - 3 AND c.y + 3
      CROSS JOIN oasis o ON o.tile_id = ot.id
        AND ($only_unoccupied_oases = 0 OR o.village_id IS NULL)
      JOIN resource_ids ri ON ri.id = o.resource_id
      JOIN requested_slot_bonuses rsb
        ON rsb.resource = ri.resource
        AND rsb.bonus = o.bonus
      GROUP BY c.id, rsb.slot_index, o.tile_id
      HAVING COUNT(DISTINCT rsb.request_id) = (
        SELECT required_bonus_count
        FROM slot_bonus_counts sbc
        WHERE sbc.slot_index = rsb.slot_index
      )
    ),
    valid_candidates AS (
      SELECT m1.candidate_tile
      FROM active_slot_count active_slots
      JOIN ranked_slots r1 ON r1.slot_rank = 1
      JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
      WHERE active_slots.value = 1

      UNION

      SELECT m1.candidate_tile
      FROM active_slot_count active_slots
      JOIN ranked_slots r1 ON r1.slot_rank = 1
      JOIN ranked_slots r2 ON r2.slot_rank = 2
      JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
      JOIN slot_matches m2
        ON m2.candidate_tile = m1.candidate_tile
        AND m2.slot_index = r2.slot_index
        AND m2.oasis_tile <> m1.oasis_tile
      WHERE active_slots.value = 2

      UNION

      SELECT m1.candidate_tile
      FROM active_slot_count active_slots
      JOIN ranked_slots r1 ON r1.slot_rank = 1
      JOIN ranked_slots r2 ON r2.slot_rank = 2
      JOIN ranked_slots r3 ON r3.slot_rank = 3
      JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
      JOIN slot_matches m2
        ON m2.candidate_tile = m1.candidate_tile
        AND m2.slot_index = r2.slot_index
        AND m2.oasis_tile <> m1.oasis_tile
      JOIN slot_matches m3
        ON m3.candidate_tile = m1.candidate_tile
        AND m3.slot_index = r3.slot_index
        AND m3.oasis_tile <> m1.oasis_tile
        AND m3.oasis_tile <> m2.oasis_tile
      WHERE active_slots.value = 3
    )
  SELECT
    c.id AS tile_id,
    c.x AS coordinates_x,
    c.y AS coordinates_y,
    c.resource_field_composition AS resource_field_composition,
    c.owner_village_id,
    c.owner_village_name,
    c.owner_village_slug,
    c.x AS owner_village_x,
    c.y AS owner_village_y,
    ((c.x - $tile_x) * (c.x - $tile_x) + (c.y - $tile_y) * (c.y - $tile_y)) AS distance_squared
  FROM candidates c
  JOIN valid_candidates vc ON vc.candidate_tile = c.id
  ORDER BY distance_squared ASC;
`;
