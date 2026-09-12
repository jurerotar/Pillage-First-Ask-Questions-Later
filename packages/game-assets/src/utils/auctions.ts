import type { HeroItem } from '@pillage-first/types/models/hero-item';
import { randomInt } from '@pillage-first/utils/math';
import { rollAuctionHouseItem } from '../auctions';
import { getItemDefinition } from './items';

export type HeroAuctionBuyListingSeed = {
  itemId: HeroItem['id'];
  amount: number;
  price: number;
  expiresAt: number;
};

const randomPriceModifier = (): number => {
  return 0.9 + Math.random() * 0.2;
};

export const getAuctionableItem = (itemId: HeroItem['id']): HeroItem => {
  const item = getItemDefinition(itemId);

  if (!item || item.basePrice === null) {
    throw new Error('Item can not be traded');
  }

  return item;
};

export const getBuyListingAmount = (item: HeroItem): number => {
  if (item.category !== 'consumable') {
    return 1;
  }

  return randomInt(2, 20);
};

export const calculateBuyPrice = (item: HeroItem, amount: number): number => {
  return Math.max(
    1,
    Math.round(item.basePrice! * amount * randomPriceModifier()),
  );
};

export const calculateSellPrice = (item: HeroItem, amount: number): number => {
  return Math.max(
    1,
    Math.round(item.basePrice! * amount * 0.2 * randomPriceModifier()),
  );
};

export const createAuctionHouseBuyListing = (
  now: number,
): HeroAuctionBuyListingSeed => {
  const item = rollAuctionHouseItem();
  const amount = getBuyListingAmount(item);

  return {
    itemId: item.id,
    amount,
    price: calculateBuyPrice(item, amount),
    expiresAt: now + randomInt(1, 24 * 60 * 60 * 1000),
  };
};
