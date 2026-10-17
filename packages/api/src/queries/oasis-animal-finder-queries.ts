export const selectOasesByAnimalsQuery = `
  WITH requested_animals AS (
    SELECT
      json_extract(value, '$[0]') AS animal_unit,
      json_extract(value, '$[1]') AS requested_amount
    FROM json_each($animal_filters)
  ),
  matching_oases AS (
    SELECT t.id AS tile_id, t.x, t.y
    FROM tiles t
    WHERE t.type_id = 2
      AND NOT EXISTS (
        SELECT 1
        FROM oasis owned
        WHERE owned.tile_id = t.id AND owned.village_id IS NOT NULL
      )
      AND NOT EXISTS (
        SELECT 1
        FROM requested_animals requested
        WHERE COALESCE((
          SELECT tr.amount
          FROM troops tr
          WHERE tr.tile_id = t.id
            AND tr.source_tile_id = t.id
            AND tr.unit_id = (
              SELECT id FROM unit_ids WHERE unit = requested.animal_unit
            )
        ), 0) < requested.requested_amount
      )
  ),
  bonuses_by_tile AS (
    SELECT
      o.tile_id,
      COALESCE(
        MAX(CASE WHEN ri.resource <> 'wheat' THEN ri.resource END),
        MAX(ri.resource)
      ) AS resource,
      CASE
        WHEN COUNT(*) = 1 AND MAX(o.bonus) = 25 THEN 1
        WHEN COUNT(*) = 2 AND MIN(o.bonus) = 25 AND MAX(o.bonus) = 25 THEN 2
        WHEN COUNT(*) = 1 AND MAX(o.bonus) = 50 THEN 3
        ELSE NULL
      END AS bonus_type
    FROM matching_oases matching
      JOIN oasis o ON o.tile_id = matching.tile_id
      JOIN resource_ids ri ON ri.id = o.resource_id
    GROUP BY o.tile_id
  )
  SELECT
    matching.tile_id,
    matching.x AS coordinates_x,
    matching.y AS coordinates_y,
    b.resource,
    b.bonus_type,
    (
      SELECT json_group_array(json_object('unitId', ui.unit, 'amount', tr.amount))
      FROM troops tr
        JOIN unit_ids ui ON ui.id = tr.unit_id
      WHERE tr.tile_id = matching.tile_id
        AND tr.source_tile_id = matching.tile_id
    ) AS animals_json,
    ((matching.x - $tile_x) * (matching.x - $tile_x)
      + (matching.y - $tile_y) * (matching.y - $tile_y)) AS distance_squared
  FROM matching_oases matching
    JOIN bonuses_by_tile b ON b.tile_id = matching.tile_id
  ORDER BY distance_squared ASC;
`;
