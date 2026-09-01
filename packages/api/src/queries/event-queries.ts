export const selectEventByIdQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE id = $event_id;
`;

export const selectNextEventQuery = `
  SELECT id, resolves_at AS resolvesAt
  FROM
    events
  WHERE
    resolves_at > $now
  ORDER BY
    resolves_at
  LIMIT 1;
`;

export const selectAllVillageEventsQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM
    events
  WHERE
    village_id = $village_id
  ORDER BY
    resolves_at;
`;

export const selectAllVillageEventsByTypeQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE type = $type
    AND (
    village_id = $village_id
      OR village_id IS NULL
    )
  ORDER BY resolves_at;
`;

export const selectAllVillageResourceTransferEventsQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE type = 'resourceTransfer'
    AND (
      village_id = $village_id
      OR JSON_EXTRACT(meta, '$.targetVillageId') = $village_id
    )
  ORDER BY resolves_at;
`;

export const selectEventsByTypeQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM
    events
  WHERE
    type = $type
  ORDER BY
    resolves_at;
`;

export const selectVillageEventExistsByTypeQuery = `
  SELECT
    EXISTS
    (
      SELECT 1
      FROM
        events
      WHERE
        type = $type
        AND village_id = $village_id
    ) AS event_exists;
`;

export const selectRelevantActiveBuildingConstructionExistsQuery = `
  SELECT EXISTS (
    SELECT 1
    FROM events e
    JOIN villages v ON v.id = e.village_id
    JOIN players p ON p.id = v.player_id
    JOIN tribe_ids ti ON ti.id = p.tribe_id
    WHERE e.village_id = $village_id
      AND (
        e.type = 'buildingConstruction'
        OR (
          e.type = 'buildingLevelChange'
          AND CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER) >
              CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER)
        )
      )
      AND (
        ti.tribe <> 'romans'
        OR (
          CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) <= 18
          AND $building_field_id <= 18
        )
        OR (
          CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) > 18
          AND $building_field_id > 18
        )
      )
  );
`;

export const selectTroopMovementEventsQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM
    events
  WHERE
    (
      village_id = $village_id
      AND type IN (
        'troopMovementReinforcements',
        'troopMovementRelocation',
        'troopMovementReturn',
        'troopMovementFindNewVillage',
        'troopMovementAttack',
        'troopMovementRaid',
        'troopMovementOasisOccupation',
        'troopMovementAdventure'
      )
    )
    OR (
      type = 'troopMovementAdventure'
      AND EXISTS (
        SELECT 1
        FROM villages v1
        JOIN villages v2 ON v1.player_id = v2.player_id
        WHERE v1.id = $village_id
          AND v2.id = events.village_id
      )
    )
  ORDER BY
    resolves_at;
`;

export const selectTroopMovementsByTileIdQuery = `
  SELECT
    e.id,
    e.type,
    e.starts_at,
    e.duration,
    e.resolves_at,
    e.meta,
    e.village_id AS originating_village_id,
    v_orig.name AS originating_village_name,
    t_orig.id AS originating_tile_id,
    p_orig.id AS player_id,
    p_orig.name AS player_name,
    ti_orig.tribe AS player_tribe,
    v_target.id AS target_village_id,
    v_target.name AS target_village_name,
    t_target.id AS target_tile_id
  FROM events e
  JOIN villages v_orig ON e.village_id = v_orig.id
  JOIN tiles t_orig ON v_orig.tile_id = t_orig.id
  JOIN players p_orig ON v_orig.player_id = p_orig.id
  JOIN tribe_ids ti_orig ON p_orig.tribe_id = ti_orig.id
  LEFT JOIN tiles t_target ON JSON_EXTRACT(e.meta, '$.targetTileId') = t_target.id
  LEFT JOIN villages v_target ON t_target.id = v_target.tile_id
  WHERE
    e.type IN (
      'troopMovementReinforcements',
      'troopMovementRelocation',
      'troopMovementReturn',
      'troopMovementFindNewVillage',
      'troopMovementAttack',
      'troopMovementRaid',
      'troopMovementOasisOccupation',
      'troopMovementAdventure'
    )
    AND (
      v_orig.tile_id = $tile_id
      OR (
        JSON_EXTRACT(e.meta, '$.targetTileId') = $tile_id
      )
      OR (
        e.type = 'troopMovementAdventure'
        AND EXISTS (
          SELECT 1
          FROM villages v1
          JOIN villages v2 ON v1.player_id = v2.player_id
          WHERE v1.tile_id = $tile_id
            AND v2.id = e.village_id
        )
      )
    )
  ORDER BY e.resolves_at ASC;
`;

export const selectTroopMovementStatsByTileIdQuery = `
  SELECT
    CASE
      WHEN e.type = 'troopMovementFindNewVillage' THEN 'findNewVillage'
      WHEN e.type = 'troopMovementAdventure' THEN 'adventure'
      WHEN e.type IN ('troopMovementReinforcements', 'troopMovementRelocation', 'troopMovementReturn') THEN
        CASE WHEN v_orig.tile_id != $tile_id THEN 'deploymentIncoming' ELSE 'deploymentOutgoing' END
      WHEN e.type IN ('troopMovementAttack', 'troopMovementRaid', 'troopMovementOasisOccupation') THEN
        CASE WHEN v_orig.tile_id != $tile_id THEN 'offensiveMovementIncoming' ELSE 'offensiveMovementOutgoing' END
    END AS movement_type,
    COUNT(*) AS count,
    MIN(e.resolves_at) AS earliest_resolves_at
  FROM events e
  JOIN villages v_orig ON e.village_id = v_orig.id
  WHERE
    e.type IN (
      'troopMovementReinforcements',
      'troopMovementRelocation',
      'troopMovementReturn',
      'troopMovementFindNewVillage',
      'troopMovementAttack',
      'troopMovementRaid',
      'troopMovementOasisOccupation',
      'troopMovementAdventure'
    )
    AND (
      v_orig.tile_id = $tile_id
      OR (
        JSON_EXTRACT(e.meta, '$.targetTileId') = $tile_id
      )
      OR (
        e.type = 'troopMovementAdventure'
        AND EXISTS (
          SELECT 1
          FROM villages v1
          JOIN villages v2 ON v1.player_id = v2.player_id
          WHERE v1.tile_id = $tile_id
            AND v2.id = e.village_id
        )
      )
    )
  GROUP BY movement_type;
`;

export const deleteEventByIdQuery = `
  DELETE
  FROM
    events
  WHERE
    id = $event_id;
`;

export const deleteUnitImprovementEventsFromLevelQuery = `
  DELETE
  FROM
    events
  WHERE
    JSON_EXTRACT(events.meta, '$.unitId') = $unit_id
    AND CAST(JSON_EXTRACT(events.meta, '$.level') AS INTEGER) >= $level
  RETURNING
    village_id AS villageId,
    JSON_EXTRACT(events.meta, '$.unitId') AS unitId,
    CAST(JSON_EXTRACT(events.meta, '$.level') AS INTEGER) AS level;
`;

export const deleteNextDemolitionEventQuery = `
  DELETE
  FROM
    events
  WHERE
    id = (
      SELECT id
      FROM
        events
      WHERE
        village_id = $village_id
        AND (
          type = 'buildingDestruction'
          OR (
            type = 'buildingLevelChange'
            AND CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER) >
                CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
          )
        )
      ORDER BY resolves_at, id
      LIMIT 1
    );
`;
