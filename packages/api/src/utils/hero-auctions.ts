import { z } from 'zod';
import {
  calculateSellPrice,
  createAuctionHouseBuyListing,
  getAuctionableItem,
} from '@pillage-first/game-assets/utils/auctions';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  getHeroAuctionBuyListingSchema,
  getHeroAuctionHistoryEntrySchema,
  getHeroAuctionSellListingSchema,
} from '../http/controllers/schemas/hero-schemas';
import {
  deleteCompletedHeroAuctionSellListingsQuery,
  deleteExpiredHeroAuctionBuyListingsQuery,
  deleteHeroAuctionBuyListingByIdQuery,
  insertCompletedHeroAuctionSellListingsHistoryQuery,
  insertCompletedHeroAuctionSellListingsSilverQuery,
  insertHeroAuctionBuyHistoryEntryQuery,
  insertHeroAuctionBuyListingsQuery,
  insertHeroAuctionSellListingQuery,
  selectAvailableHeroAuctionBuyListingByIdQuery,
  selectHeroAuctionBuyListingCountQuery,
  selectHeroAuctionBuyListingsQuery,
  selectHeroAuctionHistoryByHeroIdQuery,
  selectHeroAuctionSellListingsByHeroIdQuery,
} from '../queries/hero-auction-queries';
import {
  addHeroInventoryItem,
  getHeroIdByPlayerId,
  removeHeroInventoryItem,
} from './hero';

const silverItemId = 1025;
const activeBuyListingCount = 100;
const sellDuration = 24 * 60 * 60 * 1000;

const createBuyListings = (
  database: DbFacade,
  now: number,
  amount: number,
): void => {
  if (amount <= 0) {
    return;
  }

  const listings = Array.from({ length: amount }, () =>
    createAuctionHouseBuyListing(now),
  );

  database.exec({
    sql: insertHeroAuctionBuyListingsQuery,
    bind: {
      $listings: JSON.stringify(listings),
    },
  });
};

export const refreshHeroAuctionBuyListings = (
  database: DbFacade,
  now: number,
): void => {
  database.exec({
    sql: deleteExpiredHeroAuctionBuyListingsQuery,
    bind: { $now: now },
  });

  const activeListingAmount = database.selectValue({
    sql: selectHeroAuctionBuyListingCountQuery,
    schema: z.number(),
  })!;

  createBuyListings(database, now, activeBuyListingCount - activeListingAmount);
};

const completeHeroAuctionSellListings = (
  database: DbFacade,
  heroId: number,
  now: number,
): void => {
  database.exec({
    sql: insertCompletedHeroAuctionSellListingsSilverQuery,
    bind: {
      $hero_id: heroId,
      $silver_item_id: silverItemId,
      $now: now,
    },
  });

  database.exec({
    sql: insertCompletedHeroAuctionSellListingsHistoryQuery,
    bind: {
      $hero_id: heroId,
      $now: now,
    },
  });

  database.exec({
    sql: deleteCompletedHeroAuctionSellListingsQuery,
    bind: {
      $hero_id: heroId,
      $now: now,
    },
  });
};

export const syncHeroAuctionState = (
  database: DbFacade,
  playerId: number,
  now: number,
): number => {
  const heroId = getHeroIdByPlayerId(database, playerId);

  completeHeroAuctionSellListings(database, heroId, now);
  refreshHeroAuctionBuyListings(database, now);

  return heroId;
};

export const getHeroAuctionBuyListingRows = (
  database: DbFacade,
  playerId: number,
  now: number,
) => {
  syncHeroAuctionState(database, playerId, now);

  return database.selectObjects({
    sql: selectHeroAuctionBuyListingsQuery,
    schema: getHeroAuctionBuyListingSchema,
  });
};

export const buyHeroAuctionListingById = (
  database: DbFacade,
  playerId: number,
  listingId: number,
  now: number,
): void => {
  const heroId = syncHeroAuctionState(database, playerId, now);

  const listing = database.selectObject({
    sql: selectAvailableHeroAuctionBuyListingByIdQuery,
    bind: {
      $listing_id: listingId,
      $now: now,
    },
    schema: getHeroAuctionBuyListingSchema,
  });

  if (!listing) {
    throw new Error('Auction listing is no longer available');
  }

  removeHeroInventoryItem(database, heroId, silverItemId, listing.price);
  addHeroInventoryItem(database, heroId, listing.item_id, listing.amount);

  database.exec({
    sql: deleteHeroAuctionBuyListingByIdQuery,
    bind: { $listing_id: listingId },
  });

  database.exec({
    sql: insertHeroAuctionBuyHistoryEntryQuery,
    bind: {
      $hero_id: heroId,
      $item_id: listing.item_id,
      $amount: listing.amount,
      $price: listing.price,
      $completed_at: now,
    },
  });

  refreshHeroAuctionBuyListings(database, now);
};

export const getHeroAuctionSellListingRows = (
  database: DbFacade,
  playerId: number,
  now: number,
) => {
  const heroId = syncHeroAuctionState(database, playerId, now);

  return database.selectObjects({
    sql: selectHeroAuctionSellListingsByHeroIdQuery,
    bind: { $hero_id: heroId },
    schema: getHeroAuctionSellListingSchema,
  });
};

export const createHeroAuctionSellListing = (
  database: DbFacade,
  playerId: number,
  itemId: number,
  amount: number,
  now: number,
) => {
  const heroId = syncHeroAuctionState(database, playerId, now);
  const item = getAuctionableItem(itemId);
  const price = calculateSellPrice(item, amount);
  const sellsAt = now + sellDuration;

  removeHeroInventoryItem(database, heroId, itemId, amount);

  return database.selectObject({
    sql: insertHeroAuctionSellListingQuery,
    bind: {
      $hero_id: heroId,
      $item_id: itemId,
      $amount: amount,
      $price: price,
      $sells_at: sellsAt,
    },
    schema: getHeroAuctionSellListingSchema,
  })!;
};

export const getHeroAuctionHistoryRows = (
  database: DbFacade,
  playerId: number,
  now: number,
) => {
  const heroId = syncHeroAuctionState(database, playerId, now);

  return database.selectObjects({
    sql: selectHeroAuctionHistoryByHeroIdQuery,
    bind: { $hero_id: heroId },
    schema: getHeroAuctionHistoryEntrySchema,
  });
};
