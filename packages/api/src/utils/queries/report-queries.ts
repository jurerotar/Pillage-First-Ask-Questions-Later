export const selectReportsByPlayerIdQuery = `
  SELECT r.id, r.type, r.timestamp, r.village_id, r.defender_tile_id, r.outcome, r.tags, r.payload
  FROM
    reports r
      JOIN villages v ON v.id = r.village_id
  WHERE
    v.player_id = $player_id
  ORDER BY
    r.timestamp DESC;
`;

export const selectReportByIdQuery = `
  SELECT r.id, r.type, r.timestamp, r.village_id, r.defender_tile_id, r.outcome, r.tags, r.payload
  FROM
    reports r
  WHERE
    r.id = $report_id;
`;

export const selectUnreadReportCountByPlayerIdQuery = `
  SELECT COUNT(*) AS count
  FROM
    reports r
      JOIN villages v ON v.id = r.village_id
  WHERE
    v.player_id = $player_id
    AND INSTR(r.tags, '"read"') = 0;
`;

export const insertReportQuery = `
  INSERT INTO reports (type, timestamp, village_id, defender_tile_id, outcome, payload)
  VALUES ($type, $timestamp, $village_id, $defender_tile_id, $outcome, $payload)
  RETURNING id;
`;
