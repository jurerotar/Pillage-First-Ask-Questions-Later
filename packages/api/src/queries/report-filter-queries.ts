export const selectActiveReportFiltersQuery = `
  SELECT filter
  FROM report_filters
  WHERE player_id = $player_id
    AND is_active = 1
  ORDER BY filter;
`;

export const updateReportFiltersQuery = `
  UPDATE report_filters
  SET is_active = CASE
    WHEN filter IN (SELECT value FROM JSON_EACH($filters)) THEN 1
    ELSE 0
  END
  WHERE player_id = $player_id;
`;
