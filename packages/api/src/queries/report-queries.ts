export const selectReportsByPlayerQuery = `
  SELECT *
  FROM reports r
  WHERE r.player_id = $player_id
  ORDER BY timestamp DESC;
`;

export const selectReportByIdQuery = `
  SELECT *
  FROM reports r
  WHERE
    r.id = $report_id;
`;

export const selectTribeByTileQuery = `
  SELECT tribe_id
  FROM players
  WHERE
  id = (SELECT player_id FROM villages WHERE tile_id = $tile_id);
`;

export const updateReportQuery = `
  UPDATE reports
  SET
    is_read = COALESCE($is_read, is_read),
    is_archived = COALESCE($is_archived, is_archived)
  WHERE
    id = $report_id;
`;

export const getUnreadReportCountQuery = `
SELECT COUNT() FROM reports WHERE is_read = 0 AND player_id = $player_id
`;

export const deleteReportQuery = `
  DELETE FROM reports WHERE id = $report_id
`;
