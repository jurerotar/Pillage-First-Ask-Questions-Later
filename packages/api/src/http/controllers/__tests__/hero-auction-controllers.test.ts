import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  buyHeroAuctionListing,
  getHeroAuctionBuyListings,
  getHeroAuctionHistory,
  getHeroAuctionSellListings,
  sellHeroAuctionItem,
} from '../hero-auction-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('hero-auction-controllers', () => {
  const playerId = PLAYER_ID;
  const silverItemId = 1025;

  const getHeroId = (
    database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  ) => {
    return database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.number(),
    })!;
  };

  test('getHeroAuctionBuyListings should generate active listings on demand', async () => {
    const database = await prepareTestDatabase();

    const listings = getHeroAuctionBuyListings(
      database,
      createControllerArgs<'/players/:playerId/hero/auctions/buy'>({
        path: { playerId },
      }),
    );

    expect(listings).toHaveLength(100);
    expect(listings.every((listing) => listing.amount > 0)).toBe(true);
    expect(listings.every((listing) => listing.price > 0)).toBe(true);
    expect(listings.every((listing) => listing.expiresAt > Date.now())).toBe(
      true,
    );
  });

  test('buyHeroAuctionListing should exchange silver for item and replace listing', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);

    database.exec({
      sql: `
        INSERT INTO
          hero_inventory (hero_id, item_id, amount)
        VALUES
          ($hero_id, $item_id, 1000000);
      `,
      bind: {
        $hero_id: heroId,
        $item_id: silverItemId,
      },
    });

    const [listing] = getHeroAuctionBuyListings(
      database,
      createControllerArgs<'/players/:playerId/hero/auctions/buy'>({
        path: { playerId },
      }),
    );

    buyHeroAuctionListing(
      database,
      createControllerArgs<
        '/players/:playerId/hero/auctions/buy/:listingId',
        'post'
      >({
        path: { playerId, listingId: listing.id },
      }),
    );

    const boughtItemAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM
          hero_inventory
        WHERE
          hero_id = $hero_id
          AND item_id = $item_id;
      `,
      bind: {
        $hero_id: heroId,
        $item_id: listing.itemId,
      },
      schema: z.number(),
    });

    const silverAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM
          hero_inventory
        WHERE
          hero_id = $hero_id
          AND item_id = $item_id;
      `,
      bind: {
        $hero_id: heroId,
        $item_id: silverItemId,
      },
      schema: z.number(),
    })!;

    const listingStillExists = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          hero_auction_buy_listings
        WHERE
          id = $id;
      `,
      bind: { $id: listing.id },
      schema: z.number(),
    })!;

    const activeListingAmount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM hero_auction_buy_listings;',
      schema: z.number(),
    })!;

    expect(boughtItemAmount).toBe(listing.amount);
    expect(silverAmount).toBe(1000000 - listing.price);
    expect(listingStillExists).toBe(0);
    expect(activeListingAmount).toBe(100);
  });

  test('sellHeroAuctionItem should complete after 24 hours on demand', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);
    const itemId = 1022;

    database.exec({
      sql: `
        INSERT INTO
          hero_inventory (hero_id, item_id, amount)
        VALUES
          ($hero_id, $item_id, 3);
      `,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
      },
    });

    sellHeroAuctionItem(
      database,
      createControllerArgs<'/players/:playerId/hero/auctions/sell', 'post'>({
        path: { playerId },
        body: { itemId, amount: 2 },
      }),
    );

    const listing = database.selectObject({
      sql: `
        SELECT id, item_id, amount, price, sells_at
        FROM
          hero_auction_sell_listings
        WHERE
          hero_id = $hero_id
          AND item_id = $item_id;
      `,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
      },
      schema: z.strictObject({
        id: z.number(),
        item_id: z.number(),
        amount: z.number(),
        price: z.number(),
        sells_at: z.number(),
      }),
    })!;

    const remainingItemAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM
          hero_inventory
        WHERE
          hero_id = $hero_id
          AND item_id = $item_id;
      `,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
      },
      schema: z.number(),
    })!;

    expect(remainingItemAmount).toBe(1);

    database.exec({
      sql: `
        UPDATE hero_auction_sell_listings
        SET
          sells_at = $sells_at
        WHERE
          id = $id;
      `,
      bind: {
        $sells_at: Date.now() - 1,
        $id: listing.id,
      },
    });

    const pendingListings = getHeroAuctionSellListings(
      database,
      createControllerArgs<'/players/:playerId/hero/auctions/sell'>({
        path: { playerId },
      }),
    );

    const silverAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM
          hero_inventory
        WHERE
          hero_id = $hero_id
          AND item_id = $item_id;
      `,
      bind: {
        $hero_id: heroId,
        $item_id: silverItemId,
      },
      schema: z.number(),
    })!;

    const history = getHeroAuctionHistory(
      database,
      createControllerArgs<'/players/:playerId/hero/auctions/history'>({
        path: { playerId },
      }),
    );

    expect(pendingListings).toHaveLength(0);
    expect(silverAmount).toBe(listing.price);
    expect(history).toContainEqual(
      expect.objectContaining({
        type: 'sell',
        itemId,
        amount: 2,
        price: listing.price,
      }),
    );
  });
});
