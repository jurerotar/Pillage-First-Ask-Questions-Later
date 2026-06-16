import { prngMulberry32 } from 'ts-seedrandom';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';

export const GATHERERS_HUT_MIN_PARTY_SIZE = 5;
export const GATHERERS_HUT_MAX_PARTY_SIZE = 500;
export const GATHERERS_HUT_RESOURCES_PER_UNIT = 10;

export const calculateGatherersHutPartySize = (
  gatherersHutLevel: number,
): number => {
  const normalizedLevel = Math.min(20, Math.max(1, gatherersHutLevel));
  const progress = (normalizedLevel - 1) / 19;

  return Math.round(
    GATHERERS_HUT_MIN_PARTY_SIZE +
      (GATHERERS_HUT_MAX_PARTY_SIZE - GATHERERS_HUT_MIN_PARTY_SIZE) *
        progress ** 2,
  );
};

export const calculateGatherersHutGatheringDuration = (
  seed: string,
  serverSpeed: number,
  villageId: number,
  timestamp: number,
): number => {
  const gatheringPrng = prngMulberry32(`${seed}${villageId}${timestamp}`);

  return (
    (seededRandomIntFromInterval(gatheringPrng, 48, 72) * 60_000) / serverSpeed
  );
};

export const calculateGatherersHutGatheringResources = (
  unitAmount: number,
): number[] => {
  const totalResources = unitAmount * GATHERERS_HUT_RESOURCES_PER_UNIT;
  const baseAmount = Math.floor(totalResources / 4);
  const remainder = totalResources % 4;

  return Array.from({ length: 4 }, (_, index) => {
    return baseAmount + (index < remainder ? 1 : 0);
  });
};
