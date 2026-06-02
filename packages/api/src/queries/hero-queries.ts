export const insertAnimalCagesIntoHeroInventoryQuery = `
  INSERT INTO
    hero_inventory (hero_id, item_id, amount)
  SELECT h.id, $item_id, $amount
  FROM
    heroes h
      JOIN villages v ON v.player_id = h.player_id
  WHERE
    v.id = $village_id
  ON CONFLICT(hero_id, item_id) DO UPDATE SET
    amount = amount + EXCLUDED.amount;
`;
