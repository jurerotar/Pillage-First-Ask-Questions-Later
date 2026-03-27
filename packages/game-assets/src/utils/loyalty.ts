import type { Server } from '@pillage-first/types/models/server';

/**
 * Calculates loyalty increase frequency.
 * Loyalty increases by 1 every 60 minutes, scaled with game world speed.
 */
export const calculateLoyaltyIncreaseEventDuration = (
  serverSpeed: Server['configuration']['speed'],
): number => {
  const baseFrequencyMinutes = 60;
  return Math.trunc((baseFrequencyMinutes / serverSpeed) * 60 * 1000);
};
