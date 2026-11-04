export const selectMapFiltersQuery = `
  SELECT
    should_show_faction_reputation,
    should_show_oasis_icons,
    should_show_troop_movements,
    should_show_wheat_fields,
    should_show_tile_tooltips
  FROM
    map_filters
  WHERE player_id = $player_id;
`;

export const createUpdateMapFilterQuery = (column: string) => `
  UPDATE map_filters
  SET
    ${column} = $value
  WHERE player_id = $player_id;
`;
