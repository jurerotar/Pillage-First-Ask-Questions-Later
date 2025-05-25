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

export const calculateCurrentAmount = (
  {
    village,
    resource,
    hourlyProduction,
    storageCapacity,
    timestamp = Date.now(),
  }: CalculateCurrentAmountArgs
) => {
  const { resources, lastUpdatedAt } = village;
  const resourceAmount = resources[resource];

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds: 0,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: Math.min(resourceAmount, storageCapacity),
    };
  }

  const hasNegativeProduction = hourlyProduction < 0;
  const secondsForResourceGeneration = 3600 / Math.abs(hourlyProduction);
  const timeSinceLastUpdateInSeconds = differenceInSeconds(new Date(timestamp), new Date(lastUpdatedAt));
  const producedResources = Math.floor(timeSinceLastUpdateInSeconds / secondsForResourceGeneration);
  const calculatedCurrentAmount = resourceAmount + producedResources * (hasNegativeProduction ? -1 : 1);
  const currentAmount = hasNegativeProduction ? Math.max(calculatedCurrentAmount, 0) : Math.min(calculatedCurrentAmount, storageCapacity);

  return {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
  };
};
