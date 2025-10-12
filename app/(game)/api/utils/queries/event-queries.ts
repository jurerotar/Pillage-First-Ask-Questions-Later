export const selectAllVillageEventsQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $villageId
    ORDER BY resolves_at;
  `;

export const selectAllVillageEventsByTypeQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $villageId
      AND type = $type
    ORDER BY resolves_at;
  `;

export const selectVillageBuildingEventsQuery = `
    SELECT id, type, starts_at, duration, resolves_at, meta, village_id
    FROM events
    WHERE village_id = $villageId
      AND type IN ('buildingConstruction', 'buildingScheduledConstruction')
    ORDER BY resolves_at;
  `;
