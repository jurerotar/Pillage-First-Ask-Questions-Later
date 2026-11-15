export const selectVillageStorageDeliveriesQuery = `
  SELECT id, type, starts_at, duration, resolves_at, meta, village_id
  FROM events
  WHERE resolves_at > $now
    AND (
      (type = 'gatherersHutGatheringTrip' AND village_id = $village_id)
      OR (
        type IN ('resourceTransfer', 'troopMovementReturn')
        AND JSON_EXTRACT(meta, '$.targetTileId') = $tile_id
      )
    );
`;
