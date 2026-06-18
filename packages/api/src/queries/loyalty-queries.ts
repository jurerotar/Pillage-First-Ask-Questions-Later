export const selectTileLoyaltyQuery = `
  SELECT loyalty
  FROM
    loyalties
  WHERE
    tile_id = $tile_id;
`;
