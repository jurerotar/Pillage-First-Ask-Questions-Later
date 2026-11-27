import type { TileLoyaltyDto } from '@pillage-first/types/dtos/loyalty';
import type { Server } from '@pillage-first/types/models/server';

export const calculateLoyaltyIncreaseInterval = (
  serverSpeed: Server['configuration']['speed'],
): number => Math.trunc((60 * 60 * 1000) / serverSpeed);

export const getNextLoyaltyIncreaseAt = (
  serverCreatedAt: number,
  interval: number,
  timestamp: number,
): number => {
  const elapsedIntervals = Math.floor((timestamp - serverCreatedAt) / interval);
  return serverCreatedAt + (elapsedIntervals + 1) * interval;
};

export const getLoyaltyAt = (
  snapshot: TileLoyaltyDto,
  timestamp: number,
): TileLoyaltyDto => {
  const {
    loyalty,
    nextLoyaltyIncreaseAt,
    loyaltyIncreaseInterval,
    loyaltyIncreaseAmount,
  } = snapshot;

  if (nextLoyaltyIncreaseAt === null || timestamp < nextLoyaltyIncreaseAt) {
    return snapshot;
  }

  const ticks =
    1 +
    Math.floor((timestamp - nextLoyaltyIncreaseAt) / loyaltyIncreaseInterval);
  const currentLoyalty = Math.min(100, loyalty + ticks * loyaltyIncreaseAmount);

  return {
    ...snapshot,
    loyalty: currentLoyalty,
    nextLoyaltyIncreaseAt:
      currentLoyalty === 100
        ? null
        : nextLoyaltyIncreaseAt + ticks * loyaltyIncreaseInterval,
  };
};
