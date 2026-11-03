const selectTradeRoutesQuery = `
  SELECT
    r.id,
    r.village_id AS villageId,
    r.target_village_id AS targetVillageId,
    origin.tile_id AS originTileId,
    target.tile_id AS targetTileId,
    r.resources,
    r.interval,
    r.starts_at AS startsAt,
    r.paused,
    (
      SELECT resolves_at
      FROM events
      WHERE type = 'tradeRoute'
        AND JSON_EXTRACT(meta, '$.tradeRouteId') = r.id
    ) AS nextAt
  FROM trade_routes r
  JOIN villages origin ON origin.id = r.village_id
  JOIN villages target ON target.id = r.target_village_id
`;

export const insertTradeRouteQuery = `
  INSERT INTO trade_routes (
    village_id,
    target_village_id,
    resources,
    interval,
    starts_at
  )
  VALUES (
    $village_id,
    $target_village_id,
    $resources,
    $interval,
    $starts_at
  )
  RETURNING id;
`;

export const updateTradeRouteQuery = `
  UPDATE trade_routes
  SET
    target_village_id = $target_village_id,
    resources = $resources,
    interval = $interval,
    starts_at = $starts_at
  WHERE id = $route_id
  RETURNING id;
`;

export const deleteTradeRouteQuery =
  'DELETE FROM trade_routes WHERE id = $route_id;';

export const deleteTradeRouteEventQuery = `
  DELETE FROM events
  WHERE type = 'tradeRoute'
    AND JSON_EXTRACT(meta, '$.tradeRouteId') = $route_id;
`;

export const setTradeRoutePausedQuery =
  'UPDATE trade_routes SET paused = $paused WHERE id = $route_id;';

export const selectTradeRoutesByTileIdQuery = `${selectTradeRoutesQuery}
  WHERE origin.tile_id = $tile_id
  ORDER BY r.id;
`;

export const selectTradeRouteByIdQuery = `${selectTradeRoutesQuery}
  WHERE r.id = $route_id;
`;
