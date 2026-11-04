import { z } from 'zod';
import {
  heroAuctionBuyListingDtoSchema,
  heroAuctionHistoryEntryDtoSchema,
  heroAuctionSellListingDtoSchema,
} from '@pillage-first/types/dtos/hero';
import {
  buyHeroAuctionListingById,
  getHeroAuctionBuyListingRows,
  getHeroAuctionHistoryRows,
  getHeroAuctionSellListingRows,
  sellHeroItem,
} from '../../utils/hero-auctions';
import { createController } from '../controller';
import {
  mapHeroAuctionBuyListing,
  mapHeroAuctionHistoryEntry,
  mapHeroAuctionSellListing,
} from './mappers/hero-mapper';

export const getHeroAuctionBuyListings = createController(
  '/me/hero/auctions/buy',
  {
    summary: 'Get hero auction buy listings',
    response: z.array(heroAuctionBuyListingDtoSchema),
  },
)(({ database, context: { playerId } }) => {
  return getHeroAuctionBuyListingRows(database, playerId, Date.now()).map(
    mapHeroAuctionBuyListing,
  );
});

export const buyHeroAuctionListing = createController(
  '/me/hero/auctions/buy/:listingId',
  'post',
  {
    summary: 'Buy hero auction listing',
    requestParams: {
      path: z.strictObject({
        listingId: z.coerce.number(),
      }),
    },
  },
)(({ database, context: { playerId }, path: { listingId } }) => {
  buyHeroAuctionListingById(database, playerId, listingId, Date.now());
});

export const getHeroAuctionSellListings = createController(
  '/me/hero/auctions/sell',
  {
    summary: 'Get hero auction sell listings',
    response: z.array(heroAuctionSellListingDtoSchema),
  },
)(({ database, context: { playerId } }) => {
  return getHeroAuctionSellListingRows(database, playerId, Date.now()).map(
    mapHeroAuctionSellListing,
  );
});

export const sellHeroAuctionItem = createController(
  '/me/hero/auctions/sell',
  'post',
  {
    summary: 'Sell hero item on auction',
    requestBody: z.strictObject({
      itemId: z.number(),
      amount: z.number().int().positive(),
      mode: z.enum(['instant', 'auction']),
    }),
  },
)(({ database, context: { playerId }, body: { itemId, amount, mode } }) => {
  sellHeroItem(database, playerId, itemId, amount, mode, Date.now());
});

export const getHeroAuctionHistory = createController(
  '/me/hero/auctions/history',
  {
    summary: 'Get hero auction history',
    response: z.array(heroAuctionHistoryEntryDtoSchema),
  },
)(({ database, context: { playerId } }) => {
  return getHeroAuctionHistoryRows(database, playerId, Date.now()).map(
    mapHeroAuctionHistoryEntry,
  );
});
