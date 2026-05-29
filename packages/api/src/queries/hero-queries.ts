export const updateHeroVillageByCurrentVillageQuery = `
  UPDATE heroes
  SET village_id = $target_village_id
  WHERE
    player_id = (
      SELECT player_id
      FROM villages
      WHERE id = $current_village_id
    );
`;
