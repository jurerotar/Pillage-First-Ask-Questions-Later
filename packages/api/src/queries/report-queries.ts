export const selectReportsQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    r.subject,
    r.type,
    tag
  FROM
    reports r
    LEFT JOIN report_tags t ON r.id = t.report_id
    LEFT JOIN report_tag_ids i ON t.report_tag_id = i.id
  WHERE
    r.player_id = $player_id
  ORDER BY
    timestamp DESC;
`;

export const selectReportQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    r.subject,
    r.type,
    tag
  FROM
    reports r
    LEFT JOIN report_tags t ON r.id = t.report_id
    LEFT JOIN report_tag_ids i ON t.report_tag_id = i.id
  WHERE
    r.id = $report_id AND
    r.player_id = $player_id;
`;

export const selectTribeByTileQuery = `
  SELECT tribe_id
  FROM players
  WHERE
  id = (SELECT player_id FROM villages WHERE tile_id = $tile_id);
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
    v.id = $village_id
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
