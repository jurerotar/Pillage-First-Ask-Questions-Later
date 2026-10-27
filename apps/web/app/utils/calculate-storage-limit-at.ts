type CalculateStorageLimitAtArgs = {
  lastKnownResourceAmount: number;
  lastUpdatedAt: number;
  hourlyProduction: number;
  storageCapacity: number;
};

export const calculateStorageLimitAt = ({
  lastKnownResourceAmount,
  lastUpdatedAt,
  hourlyProduction,
  storageCapacity,
}: CalculateStorageLimitAtArgs): number | null => {
  if (
    hourlyProduction === 0 ||
    (hourlyProduction > 0 && lastKnownResourceAmount >= storageCapacity)
  ) {
    return null;
  }

  const remainingAmount = Math.max(
    0,
    hourlyProduction < 0
      ? lastKnownResourceAmount
      : storageCapacity - lastKnownResourceAmount,
  );

  return (
    lastUpdatedAt + (remainingAmount / Math.abs(hourlyProduction)) * 3_600_000
  );
};
