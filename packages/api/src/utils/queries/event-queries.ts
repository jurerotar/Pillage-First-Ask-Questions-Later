export const selectEventByIdQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE id = $event_id;
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

export const selectEventsByTypeQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM
    events
  WHERE
    type = $type
  ORDER BY
    resolves_at;
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

export const selectTroopMovementsByVillageIdQuery = `
  WITH village_coords AS (
    SELECT t.x, t.y
    FROM villages v
    JOIN tiles t ON v.tile_id = t.id
    WHERE v.id = $village_id
  )
  SELECT
    e.id,
    e.type,
    e.starts_at,
    e.duration,
    e.resolves_at,
    e.meta,
    e.village_id AS originating_village_id,
    v_orig.name AS originating_village_name,
    t_orig.x AS originating_village_x,
    t_orig.y AS originating_village_y,
    p_orig.id AS player_id,
    p_orig.name AS player_name,
    ti_orig.tribe AS player_tribe,
    v_target.id AS target_village_id,
    v_target.name AS target_village_name,
    t_target.x AS target_village_x,
    t_target.y AS target_village_y
  FROM events e
  JOIN village_coords vc ON 1=1
  JOIN villages v_orig ON e.village_id = v_orig.id
  JOIN tiles t_orig ON v_orig.tile_id = t_orig.id
  JOIN players p_orig ON v_orig.player_id = p_orig.id
  JOIN tribe_ids ti_orig ON p_orig.tribe_id = ti_orig.id
  LEFT JOIN tiles t_target ON JSON_EXTRACT(e.meta, '$.targetCoordinates.x') = t_target.x AND JSON_EXTRACT(e.meta, '$.targetCoordinates.y') = t_target.y
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
      e.village_id = $village_id
      OR (
        JSON_EXTRACT(e.meta, '$.targetCoordinates.x') = vc.x
        AND JSON_EXTRACT(e.meta, '$.targetCoordinates.y') = vc.y
      )
      OR (
        e.type = 'troopMovementAdventure'
        AND EXISTS (
          SELECT 1
          FROM villages v1
          JOIN villages v2 ON v1.player_id = v2.player_id
          WHERE v1.id = $village_id
            AND v2.id = e.village_id
        )
      )
    )
  ORDER BY e.resolves_at ASC;
`;

export const selectTroopMovementStatsByVillageIdQuery = `
  WITH village_coords AS (
    SELECT t.x, t.y
    FROM villages v
    JOIN tiles t ON v.tile_id = t.id
    WHERE v.id = $village_id
  )
  SELECT
    CASE
      WHEN e.type = 'troopMovementFindNewVillage' THEN 'findNewVillage'
      WHEN e.type = 'troopMovementAdventure' THEN 'adventure'
      WHEN e.type IN ('troopMovementReinforcements', 'troopMovementRelocation', 'troopMovementReturn') THEN
        CASE WHEN e.village_id != $village_id THEN 'deploymentIncoming' ELSE 'deploymentOutgoing' END
      WHEN e.type IN ('troopMovementAttack', 'troopMovementRaid', 'troopMovementOasisOccupation') THEN
        CASE WHEN e.village_id != $village_id THEN 'offensiveMovementIncoming' ELSE 'offensiveMovementOutgoing' END
    END AS movement_type,
    COUNT(*) AS count,
    MIN(e.resolves_at) AS earliest_resolves_at
  FROM events e
  JOIN village_coords vc ON 1=1
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
      e.village_id = $village_id
      OR (
        JSON_EXTRACT(e.meta, '$.targetCoordinates.x') = vc.x
        AND JSON_EXTRACT(e.meta, '$.targetCoordinates.y') = vc.y
      )
      OR (
        e.type = 'troopMovementAdventure'
        AND EXISTS (
          SELECT 1
          FROM villages v1
          JOIN villages v2 ON v1.player_id = v2.player_id
          WHERE v1.id = $village_id
            AND v2.id = e.village_id
        )
      )
    )
  GROUP BY movement_type;
`;
