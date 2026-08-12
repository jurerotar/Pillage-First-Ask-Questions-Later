export const selectBuildingLevelChangeHistoryQuery = `
  SELECT
    h.field_id,
    bi.building,
    h.previous_level,
    h.new_level,
    h.timestamp
  FROM
    building_level_change_history h
      JOIN building_ids bi ON h.building_id = bi.id
  WHERE
    h.village_id = $village_id
  ORDER BY
    h.timestamp DESC;
`;

export const selectUnitTrainingHistoryQuery = `
  SELECT
    h.batch_id,
    ui.unit,
    bi.building,
    h.amount,
    h.timestamp
  FROM
    unit_training_history h
      JOIN unit_ids ui ON h.unit_id = ui.id
      JOIN building_ids bi ON h.building_id = bi.id
  WHERE
    h.village_id = $village_id
    AND ($building_id IS NULL OR bi.building = $building_id)
  ORDER BY
    h.timestamp DESC;
`;

export const selectEventsHistoryQuery = `
  WITH
    requested_types AS (
      SELECT value AS type
      FROM JSON_EACH($types)
    ),
    player_villages AS (
      SELECT id
      FROM villages
      WHERE player_id = (
        SELECT player_id
        FROM villages
        WHERE id = $village_id
      )
    )
  SELECT *
  FROM (
    SELECT
      'construction-' || id AS id,
      village_id AS villageId,
      'construction' AS type,
      timestamp,
      JSON_OBJECT(
        'fieldId', field_id,
        'building', (SELECT building FROM building_ids WHERE id = building_id),
        'status', 'completed',
        'previousLevel', previous_level,
        'newLevel', new_level
      ) AS data
    FROM building_level_change_history
    WHERE
      (
        ($scope = 'village' AND village_id = $village_id)
        OR ($scope = 'global' AND village_id IN (SELECT id FROM player_villages))
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'construction')
      )

    UNION ALL

    SELECT
      'construction-cancellation-' || id AS id,
      village_id AS villageId,
      'construction' AS type,
      timestamp,
      JSON_OBJECT(
        'fieldId', field_id,
        'building', (SELECT building FROM building_ids WHERE id = building_id),
        'status', 'cancelled',
        'level', level
      ) AS data
    FROM scheduled_building_construction_cancellation_history
    WHERE
      (
        ($scope = 'village' AND village_id = $village_id)
        OR ($scope = 'global' AND village_id IN (SELECT id FROM player_villages))
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'construction')
      )

    UNION ALL

    SELECT
      'training-' || id AS id,
      village_id AS villageId,
      'training' AS type,
      timestamp,
      JSON_OBJECT(
        'batchId', batch_id,
        'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
        'building', (SELECT building FROM building_ids WHERE id = building_id),
        'amount', amount
      ) AS data
    FROM unit_training_history
    WHERE
      (
        ($scope = 'village' AND village_id = $village_id)
        OR ($scope = 'global' AND village_id IN (SELECT id FROM player_villages))
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'training')
      )

    UNION ALL

    SELECT
      'improvement-' || id AS id,
      (SELECT id FROM villages WHERE player_id = unit_improvement_history.player_id LIMIT 1) AS villageId,
      'improvement' AS type,
      timestamp,
      JSON_OBJECT(
        'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
        'previousLevel', previous_level,
        'newLevel', new_level
      ) AS data
    FROM unit_improvement_history
    WHERE
      player_id = (
        SELECT player_id
        FROM villages
        WHERE id = $village_id
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'improvement')
      )

    UNION ALL

    SELECT
      'research-' || id AS id,
      village_id AS villageId,
      'research' AS type,
      timestamp,
      JSON_OBJECT(
        'unit', (SELECT unit FROM unit_ids WHERE id = unit_id)
      ) AS data
    FROM unit_research_history
    WHERE
      (
        ($scope = 'village' AND village_id = $village_id)
        OR ($scope = 'global' AND village_id IN (SELECT id FROM player_villages))
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'research')
      )

    UNION ALL

    SELECT
      'founding-' || id AS id,
      village_id AS villageId,
      'founding' AS type,
      timestamp,
      JSON_OBJECT(
        'tileId', tile_id,
        'x', x,
        'y', y
      ) AS data
    FROM village_founding_history
    WHERE
      (
        ($scope = 'village' AND village_id = $village_id)
        OR ($scope = 'global' AND village_id IN (SELECT id FROM player_villages))
      )
      AND (
        NOT EXISTS (SELECT 1 FROM requested_types)
        OR EXISTS (SELECT 1 FROM requested_types WHERE type = 'founding')
      )
  )
  ORDER BY timestamp DESC;
`;
