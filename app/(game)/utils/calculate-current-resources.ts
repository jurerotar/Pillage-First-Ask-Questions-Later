import { differenceInSeconds } from 'date-fns';

export type CalculateCurrentAmountArgs = {
  lastKnownResourceAmount: number;
  lastUpdatedAt: number;
  hourlyProduction: number;
  storageCapacity: number;
  timestamp?: number;
};

export const calculateCurrentAmount = ({
  lastKnownResourceAmount,
  lastUpdatedAt,
  hourlyProduction,
  storageCapacity,
  timestamp = Date.now(),
}: CalculateCurrentAmountArgs) => {
  const timeSinceLastUpdateInSeconds = differenceInSeconds(
    new Date(timestamp),
    new Date(lastUpdatedAt),
  );

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: lastKnownResourceAmount,
      lastEffectiveUpdate: lastUpdatedAt,
    };
  }

  const hasNegativeProduction = hourlyProduction < 0;
  const secondsForResourceGeneration = 3600 / Math.abs(hourlyProduction);
  const producedResources = Math.floor(
    timeSinceLastUpdateInSeconds / secondsForResourceGeneration,
  );
  const delta = producedResources * (hasNegativeProduction ? -1 : 1);
  const calculatedCurrentAmount = lastKnownResourceAmount + delta;
  const currentAmount = hasNegativeProduction
    ? Math.max(calculatedCurrentAmount, 0)
    : Math.min(calculatedCurrentAmount, storageCapacity);

  const lastEffectiveUpdate =
    lastUpdatedAt + producedResources * secondsForResourceGeneration * 1000;

  return {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
    lastEffectiveUpdate,
  };
};
