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
