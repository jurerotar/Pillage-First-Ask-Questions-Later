import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import type { ResourceProductionEffectId } from 'app/interfaces/models/game/effect';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { Village } from 'app/interfaces/models/game/village';
import dayjs from 'dayjs';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

const resourceToResourceEffectMap = new Map<Resource, ResourceProductionEffectId>([
  ['wood', 'woodProduction'],
  ['clay', 'clayProduction'],
  ['iron', 'ironProduction'],
  ['wheat', 'wheatProduction'],
]);

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

  if (hourlyProduction === 0) {
    return {
      timeSinceLastUpdateInSeconds: 0,
      secondsForResourceGeneration: Number.POSITIVE_INFINITY,
      currentAmount: Math.min(resourceAmount, storageCapacity),
    };
  }

  const hasNegativeProduction = hourlyProduction < 0;
  const secondsForResourceGeneration = 3600 / Math.abs(hourlyProduction);
  const timeSinceLastUpdateInSeconds = dayjs(timestamp).diff(dayjs(lastUpdatedAt), 'second');
  const producedResources = Math.floor(timeSinceLastUpdateInSeconds / secondsForResourceGeneration);
  const calculatedCurrentAmount = resourceAmount + producedResources * (hasNegativeProduction ? -1 : 1);
  const currentAmount = hasNegativeProduction ? Math.max(calculatedCurrentAmount, 0) : Math.min(calculatedCurrentAmount, storageCapacity);

  return {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
  };
};

export const useCalculatedResource = (resource: Resource) => {
  const { currentVillage } = useCurrentVillage();

  // @ts-expect-error: TODO: Overload issue, fix when you can
  const { total: hourlyProduction } = useComputedEffect(resourceToResourceEffectMap.get(resource)!);
  const { total: storageCapacity } = useComputedEffect(resource === 'wheat' ? 'granaryCapacity' : 'warehouseCapacity');

  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  const { timeSinceLastUpdateInSeconds, secondsForResourceGeneration, currentAmount } = calculateCurrentAmount({
    village: currentVillage,
    resource,
    storageCapacity,
    hourlyProduction,
  });

  const [calculatedResourceAmount, setCalculatedResourceAmount] = useState<number>(currentAmount);

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  const resourceDepletionOrFullAt = useMemo<number | null>(() => {
    if (hourlyProduction > 0 && !isFull) {
      const secondsToFull = (storageCapacity - currentAmount) / (hourlyProduction / 3600);
      return new Date(Date.now() + secondsToFull * 1000).getTime();
    }
    if (hourlyProduction < 0 && currentAmount > 0) {
      const secondsToEmpty = currentAmount / Math.abs(hourlyProduction / 3600);
      return new Date(Date.now() + secondsToEmpty * 1000).getTime();
    }
    return null; // Neither fills nor depletes
  }, [hourlyProduction, currentAmount, storageCapacity, isFull]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    startTransition(() => {
      setCalculatedResourceAmount(currentAmount);
    });

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    if (hourlyProduction === 0) {
      return;
    }

    const updateResourceAmount = () => {
      startTransition(() => {
        setCalculatedResourceAmount((prevAmount) => {
          let newAmount = prevAmount + 1;
          if (newAmount > storageCapacity) {
            newAmount = storageCapacity;
          }
          if (newAmount < 0) {
            newAmount = 0;
          }
          return newAmount;
        });
      });
    };

    const remainingTimeForNextUnit = secondsForResourceGeneration - (timeSinceLastUpdateInSeconds % secondsForResourceGeneration);

    timeoutId.current = setTimeout(() => {
      updateResourceAmount();
      intervalId.current = setInterval(updateResourceAmount, secondsForResourceGeneration * 1000);
    }, remainingTimeForNextUnit * 1000);

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [currentVillage.lastUpdatedAt, hourlyProduction, storageCapacity, secondsForResourceGeneration]);

  return {
    calculatedResourceAmount,
    hourlyProduction,
    storageCapacity,
    isFull,
    hasNegativeProduction,
    resourceDepletionOrFullAt,
  };
};
