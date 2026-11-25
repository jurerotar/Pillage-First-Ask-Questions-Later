type CalculateCurrentAmountArgs = {
  lastKnownResourceAmount: number;
  lastUpdatedAt: number;
  hourlyProduction: number;
  storageCapacity: number;
  timestamp?: number;
};

type CalculateCurrentAmountReturn = {
  timeSinceLastUpdateInSeconds: number;
  secondsForResourceGeneration: number;
  currentAmount: number;
  lastEffectiveUpdate: number;
};

export const calculateCurrentAmount = ({
  lastKnownResourceAmount,
  lastUpdatedAt,
  hourlyProduction,
  storageCapacity,
  timestamp = Date.now(),
}: CalculateCurrentAmountArgs): CalculateCurrentAmountReturn => {
  const deltaMs = Math.max(0, timestamp - lastUpdatedAt);
  const timeSinceLastUpdateInSeconds = Math.floor(deltaMs / 1000);
  // Capacity may have fallen since the last update, including with no production.
  const storedAmount = Math.min(lastKnownResourceAmount, storageCapacity);

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: storedAmount,
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
  const calculatedCurrentAmount = storedAmount + delta;

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
