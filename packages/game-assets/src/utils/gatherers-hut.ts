import { prngMulberry32 } from 'ts-seedrandom';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';

export const GATHERERS_HUT_RESOURCES_PER_UNIT = 4;
export const GATHERERS_HUT_MIN_LEVEL = 1;
export const GATHERERS_HUT_MAX_LEVEL = 20;
export const GATHERERS_HUT_MIN_PARTY_SIZE = 14;
export const GATHERERS_HUT_MAX_PARTY_SIZE = 508;
const GATHERERS_HUT_PARTY_SIZE_GROWTH_EXPONENT = 1.114;

export const calculateGatherersHutPartySize = (
  gatherersHutLevel: number,
): number => {
  const normalizedLevel = Math.min(
    GATHERERS_HUT_MAX_LEVEL,
    Math.max(1, Math.trunc(gatherersHutLevel)),
  );
  const progress =
    (normalizedLevel - GATHERERS_HUT_MIN_LEVEL) /
    (GATHERERS_HUT_MAX_LEVEL - GATHERERS_HUT_MIN_LEVEL);
  const shapedProgress = progress ** GATHERERS_HUT_PARTY_SIZE_GROWTH_EXPONENT;

  return Math.round(
    GATHERERS_HUT_MIN_PARTY_SIZE *
      (GATHERERS_HUT_MAX_PARTY_SIZE / GATHERERS_HUT_MIN_PARTY_SIZE) **
        shapedProgress,
  );
};

export const calculateGatherersHutGatheringDuration = (
  seed: string,
  serverSpeed: number,
  villageId: number,
  completedGatheringTripCount: number,
): number => {
  const gatheringPrng = prngMulberry32(
    `${seed}${villageId}${completedGatheringTripCount}`,
  );

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
