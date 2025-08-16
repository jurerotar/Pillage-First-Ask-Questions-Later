import type { Resource } from 'app/interfaces/models/game/resource';
import type { Village } from 'app/interfaces/models/game/village';
import { differenceInSeconds } from 'date-fns';

export type CalculateCurrentAmountArgs = {
  village: Village;
  resource: Resource;
  hourlyProduction: number;
  storageCapacity: number;
  timestamp?: number;
};

export const calculateCurrentAmount = ({
  village,
  resource,
  hourlyProduction,
  storageCapacity,
  timestamp = Date.now(),
}: CalculateCurrentAmountArgs) => {
  const { resources, lastUpdatedAt } = village;
  const resourceAmount = resources[resource];

  const timeSinceLastUpdateInSeconds = differenceInSeconds(
    new Date(timestamp),
    new Date(lastUpdatedAt),
  );

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: resourceAmount,
      lastEffectiveUpdate: lastUpdatedAt,
    };
  }

  const hasNegativeProduction = hourlyProduction < 0;
  const secondsForResourceGeneration = 3600 / Math.abs(hourlyProduction);
  const producedResources = Math.floor(
    timeSinceLastUpdateInSeconds / secondsForResourceGeneration,
  );
  const delta = producedResources * (hasNegativeProduction ? -1 : 1);
  const calculatedCurrentAmount = resourceAmount + delta;
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
