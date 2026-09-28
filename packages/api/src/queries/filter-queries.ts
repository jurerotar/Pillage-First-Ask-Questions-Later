export const selectActiveFiltersQuery = `
  SELECT filter
  FROM filters
  WHERE player_id = $player_id
    AND name = $name
  ORDER BY filter;
`;

export const deleteFiltersQuery = `
  DELETE
  FROM filters
  WHERE player_id = $player_id
    AND name = $name;
`;

export const insertFiltersQuery = `
  INSERT INTO filters (player_id, name, filter)
  SELECT DISTINCT $player_id, $name, value
  FROM JSON_EACH($filters);
`;
