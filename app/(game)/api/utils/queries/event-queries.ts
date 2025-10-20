export const selectEventByIdQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE id = $event_id;
`;

export const deleteEventByIdQuery = `
  DELETE
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

export const selectVillageBuildingEventsQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE village_id = $village_id
    AND type IN ('buildingLevelChange', 'buildingScheduledConstruction')
  ORDER BY resolves_at;
`;
