export const selectHeroOriginVillageIdQuery = `
  SELECT
    v.id
  FROM
    troops tr
      JOIN villages v ON tr.source_tile_id = v.tile_id
  WHERE
    tr.unit_id = 'HERO'
    AND v.player_id = $playerId;
`;
