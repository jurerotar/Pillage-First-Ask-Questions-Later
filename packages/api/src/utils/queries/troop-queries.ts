export const selectHeroOriginVillageIdQuery = `
  SELECT
    v.id
  FROM
    troops tr
      JOIN villages v ON tr.source_tile_id = v.tile_id
      JOIN unit_ids ui ON ui.id = tr.unit_id
  WHERE
    ui.unit = 'HERO'
    AND v.player_id = $playerId;
`;
