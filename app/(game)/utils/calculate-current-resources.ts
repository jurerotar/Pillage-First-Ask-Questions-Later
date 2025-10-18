type CalculateCurrentAmountArgs = {
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
  const deltaMs = Math.max(0, timestamp - lastUpdatedAt);
  const timeSinceLastUpdateInSeconds = Math.floor(deltaMs / 1000);

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: lastKnownResourceAmount,
      lastEffectiveUpdate: lastUpdatedAt,
    };
  }

  const absHourly = Math.abs(hourlyProduction);
  // Ms needed to produce 1 unit
  const periodMs = 3_600_000 / absHourly;
  const secondsForResourceGeneration = periodMs / 1000;

  const producedResources = Math.floor((deltaMs * absHourly) / 3_600_000);

  const sign = hourlyProduction < 0 ? -1 : 1;
  const delta = producedResources * sign;
  const calculatedCurrentAmount = lastKnownResourceAmount + delta;

  const currentAmount =
    sign < 0
      ? Math.max(calculatedCurrentAmount, 0)
      : Math.min(calculatedCurrentAmount, storageCapacity);

  const lastEffectiveUpdate =
    lastUpdatedAt + Math.floor(producedResources * periodMs);

  return {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
    lastEffectiveUpdate,
  };
};
