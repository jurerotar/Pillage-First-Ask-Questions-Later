export const selectTileLoyaltyQuery = `
  SELECT
    s.created_at AS serverCreatedAt,
    s.speed,
    COALESCE(l.loyalty, 100) AS loyalty,
    l.next_loyalty_increase_at AS nextLoyaltyIncreaseAt,
    1 + COALESCE((
      SELECT bf.level
      FROM villages v
        JOIN building_fields bf ON bf.village_id = v.id
        JOIN building_ids bi ON bi.id = bf.building_id
      WHERE v.tile_id = $tile_id AND bi.building = 'RESIDENCE'
      LIMIT 1
    ), 0) AS loyaltyIncreaseAmount
  FROM servers s
    LEFT JOIN loyalties l ON l.tile_id = $tile_id
  LIMIT 1;
`;
