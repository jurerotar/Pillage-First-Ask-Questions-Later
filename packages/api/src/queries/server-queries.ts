export const selectServerQuery = `
  SELECT
    id,
    version,
    name,
    slug,
    created_at,
    seed,
    speed,
    map_size,
    player_name,
    player_tribe
  FROM
    servers;
`;

export const selectServerMapSizeQuery = `
  SELECT map_size
  FROM
    servers
  LIMIT 1;
`;
