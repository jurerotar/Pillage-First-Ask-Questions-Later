export const selectReportsQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    rty.report_type AS type,
    roi.report_outcome AS outcome,
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    origin_t.x AS battle_origin_x,
    origin_t.y AS battle_origin_y,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
      END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    ar.adventure_id,
    ar.item_id,
    ar.health_before,
    ar.health_after,
    mr.id AS movement_id,
    mr.movement_type,
    movement_origin_tribe.tribe AS movement_tribe,
    mr.origin_tile_id AS movement_origin_tile_id,
    mr.target_tile_id AS movement_target_tile_id,
    movement_origin_p.name AS movement_origin_player_name,
    movement_origin_p.slug AS movement_origin_player_slug,
    movement_origin_v.name AS movement_origin_name,
    movement_origin_t.x AS movement_origin_x,
    movement_origin_t.y AS movement_origin_y,
    movement_target_p.name AS movement_target_player_name,
    movement_target_p.slug AS movement_target_player_slug,
    CASE
      WHEN movement_target_v.id IS NOT NULL THEN movement_target_v.name
      WHEN movement_target_o.id IS NOT NULL THEN 'Oasis'
      ELSE NULL
      END AS movement_target_name,
    movement_target_t.x AS movement_target_x,
    movement_target_t.y AS movement_target_y,
    tr.id AS trade_id,
    tr.origin_tile_id AS trade_origin_tile_id,
    tr.target_tile_id AS trade_target_tile_id,
    trade_origin_v.name AS trade_origin_name,
    trade_origin_t.x AS trade_origin_x,
    trade_origin_t.y AS trade_origin_y,
    trade_target_v.name AS trade_target_name,
    trade_target_t.x AS trade_target_x,
    trade_target_t.y AS trade_target_y,
    tr.wood AS trade_wood,
    tr.clay AS trade_clay,
    tr.iron AS trade_iron,
    tr.wheat AS trade_wheat,
    tag
  FROM
    reports r
    JOIN report_type_ids rty ON r.type_id = rty.id
    JOIN report_outcome_ids roi ON r.report_outcome_id = roi.id
    LEFT JOIN battles b ON r.id = b.report_id
    LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
    LEFT JOIN villages origin_v ON origin_t.id = origin_v.tile_id
    LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
    LEFT JOIN villages target_v ON target_t.id = target_v.tile_id
    LEFT JOIN oasis target_o ON target_t.id = target_o.tile_id
    LEFT JOIN hero_adventure_reports ar ON r.id = ar.report_id
    LEFT JOIN movement_reports mr ON r.id = mr.report_id
    LEFT JOIN tiles movement_origin_t ON mr.origin_tile_id = movement_origin_t.id
    LEFT JOIN villages movement_origin_v ON movement_origin_t.id = movement_origin_v.tile_id
    LEFT JOIN players movement_origin_p ON movement_origin_v.player_id = movement_origin_p.id
    LEFT JOIN tribe_ids movement_origin_tribe ON movement_origin_p.tribe_id = movement_origin_tribe.id
    LEFT JOIN tiles movement_target_t ON mr.target_tile_id = movement_target_t.id
    LEFT JOIN villages movement_target_v ON movement_target_t.id = movement_target_v.tile_id
    LEFT JOIN players movement_target_p ON movement_target_v.player_id = movement_target_p.id
    LEFT JOIN oasis movement_target_o ON movement_target_t.id = movement_target_o.tile_id
    LEFT JOIN trading_reports tr ON r.id = tr.report_id
    LEFT JOIN tiles trade_origin_t ON tr.origin_tile_id = trade_origin_t.id
    LEFT JOIN villages trade_origin_v ON trade_origin_t.id = trade_origin_v.tile_id
    LEFT JOIN tiles trade_target_t ON tr.target_tile_id = trade_target_t.id
    LEFT JOIN villages trade_target_v ON trade_target_t.id = trade_target_v.tile_id
    LEFT JOIN report_tags t ON r.id = t.report_id
    LEFT JOIN report_tag_ids i ON t.report_tag_id = i.id
  WHERE
    r.player_id = $player_id
    AND ($scope != 'village' OR r.village_id = $village_id)
    AND (
      $scope != 'unread'
      OR NOT EXISTS (
        SELECT
          1
        FROM
          report_tags rt
          JOIN report_tag_ids rti ON rt.report_tag_id = rti.id
        WHERE
          rt.report_id = r.id
          AND rti.tag = 'read'
      )
    )
    AND (
      $scope != 'archived'
      OR EXISTS (
        SELECT
          1
        FROM
          report_tags rt
          JOIN report_tag_ids rti ON rt.report_tag_id = rti.id
        WHERE
          rt.report_id = r.id
          AND rti.tag = 'archived'
      )
    )
    AND (
      $type_count = 0
      OR ($include_battle = 1 AND rty.report_type = 'battle')
      OR ($include_adventure = 1 AND rty.report_type = 'adventure')
      OR ($include_trade = 1 AND rty.report_type = 'trade')
      OR ($include_movement = 1 AND rty.report_type = 'movement')
    )
  ORDER BY
    timestamp DESC;
`;

export const selectReportQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    rty.report_type AS type,
    roi.report_outcome AS outcome,
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    origin_t.x AS battle_origin_x,
    origin_t.y AS battle_origin_y,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
      END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    ar.adventure_id,
    ar.item_id,
    ar.health_before,
    ar.health_after,
    mr.id AS movement_id,
    mr.movement_type,
    movement_origin_tribe.tribe AS movement_tribe,
    mr.origin_tile_id AS movement_origin_tile_id,
    mr.target_tile_id AS movement_target_tile_id,
    movement_origin_p.name AS movement_origin_player_name,
    movement_origin_p.slug AS movement_origin_player_slug,
    movement_origin_v.name AS movement_origin_name,
    movement_origin_t.x AS movement_origin_x,
    movement_origin_t.y AS movement_origin_y,
    movement_target_p.name AS movement_target_player_name,
    movement_target_p.slug AS movement_target_player_slug,
    CASE
      WHEN movement_target_v.id IS NOT NULL THEN movement_target_v.name
      WHEN movement_target_o.id IS NOT NULL THEN 'Oasis'
      ELSE NULL
      END AS movement_target_name,
    movement_target_t.x AS movement_target_x,
    movement_target_t.y AS movement_target_y,
    tr.id AS trade_id,
    tr.origin_tile_id AS trade_origin_tile_id,
    tr.target_tile_id AS trade_target_tile_id,
    trade_origin_v.name AS trade_origin_name,
    trade_origin_t.x AS trade_origin_x,
    trade_origin_t.y AS trade_origin_y,
    trade_target_v.name AS trade_target_name,
    trade_target_t.x AS trade_target_x,
    trade_target_t.y AS trade_target_y,
    tr.wood AS trade_wood,
    tr.clay AS trade_clay,
    tr.iron AS trade_iron,
    tr.wheat AS trade_wheat,
    tag
  FROM
    reports r
    JOIN report_type_ids rty ON r.type_id = rty.id
    JOIN report_outcome_ids roi ON r.report_outcome_id = roi.id
    LEFT JOIN battles b ON r.id = b.report_id
    LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
    LEFT JOIN villages origin_v ON origin_t.id = origin_v.tile_id
    LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
    LEFT JOIN villages target_v ON target_t.id = target_v.tile_id
    LEFT JOIN oasis target_o ON target_t.id = target_o.tile_id
    LEFT JOIN hero_adventure_reports ar ON r.id = ar.report_id
    LEFT JOIN movement_reports mr ON r.id = mr.report_id
    LEFT JOIN tiles movement_origin_t ON mr.origin_tile_id = movement_origin_t.id
    LEFT JOIN villages movement_origin_v ON movement_origin_t.id = movement_origin_v.tile_id
    LEFT JOIN players movement_origin_p ON movement_origin_v.player_id = movement_origin_p.id
    LEFT JOIN tribe_ids movement_origin_tribe ON movement_origin_p.tribe_id = movement_origin_tribe.id
    LEFT JOIN tiles movement_target_t ON mr.target_tile_id = movement_target_t.id
    LEFT JOIN villages movement_target_v ON movement_target_t.id = movement_target_v.tile_id
    LEFT JOIN players movement_target_p ON movement_target_v.player_id = movement_target_p.id
    LEFT JOIN oasis movement_target_o ON movement_target_t.id = movement_target_o.tile_id
    LEFT JOIN trading_reports tr ON r.id = tr.report_id
    LEFT JOIN tiles trade_origin_t ON tr.origin_tile_id = trade_origin_t.id
    LEFT JOIN villages trade_origin_v ON trade_origin_t.id = trade_origin_v.tile_id
    LEFT JOIN tiles trade_target_t ON tr.target_tile_id = trade_target_t.id
    LEFT JOIN villages trade_target_v ON trade_target_t.id = trade_target_v.tile_id
    LEFT JOIN report_tags t ON r.id = t.report_id
    LEFT JOIN report_tag_ids i ON t.report_tag_id = i.id
  WHERE
    r.id = $report_id AND
    r.player_id = $player_id;
`;

export const selectBattlePlayerInformationQuery = `
  SELECT
    p.name AS player_name,
    p.slug AS player_slug,
    v.name AS village_name,
    t.x,
    t.y
  FROM
    villages v
    JOIN players p ON v.player_id = p.id
    JOIN tiles t ON v.tile_id = t.id
  WHERE
    t.id = $tile_id
`;

export const selectBattleOasisInformationQuery = `
  SELECT
    p.name AS player_name,
    p.slug AS player_slug,
    x,
    y
  FROM
    oasis o
    JOIN tiles t ON o.tile_id = t.id
    LEFT JOIN villages v ON o.village_id = v.id
    LEFT JOIN players p ON v.player_id = p.id
  WHERE
    o.tile_id = $tile_id
`;

export const deleteReportQuery = `
  DELETE FROM reports WHERE id = $report_id
`;

export const insertReportTagQuery = `
  INSERT
  OR IGNORE INTO report_tags
  VALUES
    (
      $report_id,
      (
        SELECT
          id
        FROM
          report_tag_ids
        WHERE
          tag = $tag
      )
    )
`;

export const deleteReportTagQuery = `
  DELETE FROM
    report_tags
  WHERE
    report_id = $report_id
    AND report_tag_id = (
      SELECT
        id
      FROM
        report_tag_ids
      WHERE
        tag = $tag
    )
`;
