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

export const selectHeroSpeedQuery = `
  SELECT speed
  FROM heroes
  LIMIT 1;
`;

export const selectHeroIdByPlayerIdQuery = `
  SELECT id
  FROM heroes
  WHERE player_id = $player_id;
`;

export const selectHeroInventoryAmountByHeroIdAndItemIdQuery = `
  SELECT amount
  FROM
    hero_inventory
  WHERE
    hero_id = $hero_id
    AND item_id = $item_id;
`;

export const insertHeroItemIntoHeroInventoryQuery = `
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

export const insertHeroItemIntoHeroInventoryByHeroIdQuery = `
  INSERT INTO
    hero_inventory (hero_id, item_id, amount)
  VALUES
    ($hero_id, $item_id, $amount)
  ON CONFLICT(hero_id, item_id) DO UPDATE SET
    amount = amount + EXCLUDED.amount;
`;

export const deleteHeroInventoryItemByHeroIdAndItemIdQuery = `
  DELETE
  FROM
    hero_inventory
  WHERE
    hero_id = $hero_id
    AND item_id = $item_id;
`;

export const updateHeroInventoryItemAmountByHeroIdAndItemIdQuery = `
  UPDATE hero_inventory
  SET
    amount = amount - $amount
  WHERE
    hero_id = $hero_id
    AND item_id = $item_id;
`;
