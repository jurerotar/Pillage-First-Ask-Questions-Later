export const selectReportsByPlayerQuery = `
  SELECT *
  FROM reports r
  WHERE r.player_id = $player_id
  ORDER BY timestamp DESC;
`;

export const selectReportByPlayerAndReportQuery = `
  SELECT *
  FROM reports r
  WHERE
    r.player_id = $player_id and r.id = $report_id;
`;

export const selectTribeByTileQuery = `
  SELECT tribe_id
  FROM players
  WHERE
  id = (SELECT player_id FROM villages WHERE tile_id = $tile_id);
`;
