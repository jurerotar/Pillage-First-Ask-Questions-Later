import { z } from 'zod';
import { silverItem } from '@pillage-first/game-assets/items';
import {
  calculateAuctionSellPrice,
  calculateInstantSellPrice,
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
  insertHeroAuctionSellHistoryEntryQuery,
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

const activeBuyListingCount = 100;
const sellDuration = 24 * 60 * 60 * 1000;

export type HeroAuctionSellMode = 'instant' | 'auction';

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
      $silver_item_id: silverItem.id,
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

  removeHeroInventoryItem(database, heroId, silverItem.id, listing.price);
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

export const sellHeroItem = (
  database: DbFacade,
  playerId: number,
  itemId: number,
  amount: number,
  mode: HeroAuctionSellMode,
  now: number,
) => {
  const heroId = syncHeroAuctionState(database, playerId, now);
  const item = getAuctionableItem(itemId);
  const price =
    mode === 'instant'
      ? calculateInstantSellPrice(item, amount)
      : calculateAuctionSellPrice(item, amount);

  removeHeroInventoryItem(database, heroId, itemId, amount);

  if (mode === 'instant') {
    addHeroInventoryItem(database, heroId, silverItem.id, price);

    database.exec({
      sql: insertHeroAuctionSellHistoryEntryQuery,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
        $amount: amount,
        $price: price,
        $completed_at: now,
      },
    });

    return;
  }

  const sellsAt = now + sellDuration;

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
