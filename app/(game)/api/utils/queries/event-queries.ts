export const selectAllVillageEventsQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $village_id
    ORDER BY resolves_at;
  `;

export const selectAllVillageEventsByTypeQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $village_id
      AND type = $type
    ORDER BY resolves_at;
  `;

export const selectVillageBuildingEventsQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $village_id
      AND type IN ('buildingConstruction', 'buildingScheduledConstruction')
    ORDER BY resolves_at;
  `;
