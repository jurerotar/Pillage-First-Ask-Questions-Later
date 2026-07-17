export const selectReportsQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    rty.report_type AS type,
    cri.combat_result AS combat_result_id,
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
      END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    tag
  FROM
    reports r
    JOIN report_type_ids rty ON r.type_id = rty.id
    LEFT JOIN battles b ON r.id = b.report_id
    LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
    LEFT JOIN villages origin_v ON origin_t.id = origin_v.tile_id
    LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
    LEFT JOIN villages target_v ON target_t.id = target_v.tile_id
    LEFT JOIN oasis target_o ON target_t.id = target_o.tile_id
    LEFT JOIN combat_result_ids cri ON r.combat_result_id = cri.id
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
          AND rti.tag = 'READ'
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
          AND rti.tag = 'ARCHIVED'
      )
    )
    AND (
      $type_count = 0
      OR ($include_battle = 1 AND rty.report_type = 'battle')
      OR ($include_adventure = 1 AND rty.report_type = 'adventure')
      OR ($include_trade = 1 AND rty.report_type = 'trade')
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
    cri.combat_result AS combat_result_id,
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
      END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    tag
  FROM
    reports r
    JOIN report_type_ids rty ON r.type_id = rty.id
    LEFT JOIN battles b ON r.id = b.report_id
    LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
    LEFT JOIN villages origin_v ON origin_t.id = origin_v.tile_id
    LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
    LEFT JOIN villages target_v ON target_t.id = target_v.tile_id
    LEFT JOIN oasis target_o ON target_t.id = target_o.tile_id
    LEFT JOIN combat_result_ids cri ON r.combat_result_id = cri.id
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
