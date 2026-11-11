const selectTradeRouteColumnsQuery = `
  SELECT
    r.id,
    r.village_id AS villageId,
    r.target_village_id AS targetVillageId,
    origin.tile_id AS originTileId,
    target.tile_id AS targetTileId,
    r.resources,
    r.minimum_resources AS minimumResources,
    r.minimum_merchants AS minimumMerchants,
    r.interval,
    r.starts_at AS startsAt,
    r.paused
`;

const selectTradeRouteJoinsQuery = `
  FROM trade_routes r
  JOIN villages origin ON origin.id = r.village_id
  JOIN villages target ON target.id = r.target_village_id
`;

const selectTradeRoutesQuery = `${selectTradeRouteColumnsQuery},
    (
      SELECT resolves_at
      FROM events
      WHERE type = 'tradeRoute'
        AND JSON_EXTRACT(meta, '$.tradeRouteId') = r.id
    ) AS nextAt
  ${selectTradeRouteJoinsQuery}
`;

export const insertTradeRouteQuery = `
  INSERT INTO trade_routes (
    village_id,
    target_village_id,
    resources,
    minimum_resources,
    minimum_merchants,
    interval,
    starts_at
  )
  VALUES (
    $village_id,
    $target_village_id,
    $resources,
    $minimum_resources,
    $minimum_merchants,
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
    minimum_resources = $minimum_resources,
    minimum_merchants = $minimum_merchants,
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

export const selectTradeRoutesByTileIdQuery = `
  WITH matching_routes AS MATERIALIZED (
    ${selectTradeRouteColumnsQuery}
    ${selectTradeRouteJoinsQuery}
    WHERE origin.tile_id = $tile_id AND origin.player_id = $player_id
  ), batch_enabled AS MATERIALIZED (
    SELECT 1 WHERE (SELECT COUNT(*) FROM matching_routes) > 32
  ), route_events AS (
    -- SQLite takes resolves_at from the row supplying MIN(id), preserving the
    -- first matching event when duplicate schedules exist.
    SELECT routes.id AS route_id, e.resolves_at, MIN(e.id) AS first_event_id
    FROM batch_enabled
    CROSS JOIN events e
    JOIN matching_routes routes ON routes.id = JSON_EXTRACT(e.meta, '$.tradeRouteId')
    WHERE e.type = 'tradeRoute'
    GROUP BY routes.id
  )
  SELECT r.*,
    -- Small listings can stop at each route's first event. Large listings group
    -- events once instead of scanning the queue separately for every route.
    CASE WHEN (SELECT COUNT(*) FROM matching_routes) <= 32 THEN (
      SELECT resolves_at FROM events
      WHERE type = 'tradeRoute' AND JSON_EXTRACT(meta, '$.tradeRouteId') = r.id
    ) ELSE route_events.resolves_at END AS nextAt
  FROM matching_routes r
  LEFT JOIN route_events ON route_events.route_id = r.id
  ORDER BY r.id;
`;

export const selectTradeRouteByIdQuery = `${selectTradeRoutesQuery}
  WHERE r.id = $route_id;
`;

export const selectPlayerTradeRouteByIdQuery = `${selectTradeRoutesQuery}
  WHERE r.id = $route_id AND origin.player_id = $player_id;
`;
