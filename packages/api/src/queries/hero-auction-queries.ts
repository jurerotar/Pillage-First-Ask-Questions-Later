export const deleteExpiredHeroAuctionBuyListingsQuery = `
  DELETE
  FROM
    hero_auction_buy_listings
  WHERE
    expires_at <= $now;
`;

export const selectHeroAuctionBuyListingCountQuery = `
  SELECT COUNT(*)
  FROM hero_auction_buy_listings;
`;

export const insertHeroAuctionBuyListingsQuery = `
  INSERT INTO
    hero_auction_buy_listings (item_id, amount, price, expires_at)
  SELECT
    json_extract(listing.value, '$.itemId'),
    json_extract(listing.value, '$.amount'),
    json_extract(listing.value, '$.price'),
    json_extract(listing.value, '$.expiresAt')
  FROM
    json_each($listings) AS listing;
`;

export const insertCompletedHeroAuctionSellListingsSilverQuery = `
  INSERT INTO
    hero_inventory (hero_id, item_id, amount)
  SELECT
    hero_id,
    $silver_item_id,
    SUM(price)
  FROM
    hero_auction_sell_listings
  WHERE
    hero_id = $hero_id
    AND sells_at <= $now
  GROUP BY
    hero_id
  ON CONFLICT(hero_id, item_id) DO UPDATE SET
    amount = amount + EXCLUDED.amount;
`;

export const insertCompletedHeroAuctionSellListingsHistoryQuery = `
  INSERT INTO
    hero_auction_history (hero_id, type, item_id, amount, price, completed_at)
  SELECT
    hero_id,
    'sell',
    item_id,
    amount,
    price,
    sells_at
  FROM
    hero_auction_sell_listings
  WHERE
    hero_id = $hero_id
    AND sells_at <= $now;
`;

export const deleteCompletedHeroAuctionSellListingsQuery = `
  DELETE
  FROM
    hero_auction_sell_listings
  WHERE
    hero_id = $hero_id
    AND sells_at <= $now;
`;

export const selectHeroAuctionBuyListingsQuery = `
  SELECT id, item_id, amount, price, expires_at
  FROM
    hero_auction_buy_listings
  ORDER BY expires_at ASC, id ASC;
`;

export const selectAvailableHeroAuctionBuyListingByIdQuery = `
  SELECT id, item_id, amount, price, expires_at
  FROM
    hero_auction_buy_listings
  WHERE
    id = $listing_id
    AND expires_at > $now;
`;

export const deleteHeroAuctionBuyListingByIdQuery = `
  DELETE
  FROM
    hero_auction_buy_listings
  WHERE
    id = $listing_id;
`;

export const insertHeroAuctionBuyHistoryEntryQuery = `
  INSERT INTO
    hero_auction_history (hero_id, type, item_id, amount, price, completed_at)
  VALUES
    ($hero_id, 'buy', $item_id, $amount, $price, $completed_at);
`;

export const selectHeroAuctionSellListingsByHeroIdQuery = `
  SELECT id, item_id, amount, price, sells_at
  FROM
    hero_auction_sell_listings
  WHERE
    hero_id = $hero_id
  ORDER BY sells_at ASC, id ASC;
`;

export const insertHeroAuctionSellListingQuery = `
  INSERT INTO
    hero_auction_sell_listings (hero_id, item_id, amount, price, sells_at)
  VALUES
    ($hero_id, $item_id, $amount, $price, $sells_at)
  RETURNING id, item_id, amount, price, sells_at;
`;

export const selectHeroAuctionHistoryByHeroIdQuery = `
  SELECT id, type, item_id, amount, price, completed_at
  FROM
    hero_auction_history
  WHERE
    hero_id = $hero_id
  ORDER BY completed_at DESC, id DESC;
`;
