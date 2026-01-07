import { startTransition, useEffect, useRef, useState } from 'react';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import type { Resource } from '@pillage-first/types/models/resource';
import { calculateCurrentAmount } from '@pillage-first/utils/game/calculate-current-resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';

const resourceToResourceEffectMap = new Map<
  Resource,
  ResourceProductionEffectId
>([
  ['wood', 'woodProduction'],
  ['clay', 'clayProduction'],
  ['iron', 'ironProduction'],
  ['wheat', 'wheatProduction'],
]);

export const useCalculatedResource = (
  resource: Resource,
  storageCapacity: number,
) => {
  const { currentVillage } = useCurrentVillage();

  const { total: hourlyProduction } = useComputedEffect(
    resourceToResourceEffectMap.get(resource)!,
  );

  const lastKnownResourceAmount = currentVillage.resources[resource];

  const timeoutId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);

  const {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
  } = calculateCurrentAmount({
    lastKnownResourceAmount,
    lastUpdatedAt: currentVillage.lastUpdatedAt,
    storageCapacity,
    hourlyProduction,
  });

  const [calculatedResourceAmount, setCalculatedResourceAmount] =
    useState<number>(currentAmount);

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is intentional
  useEffect(() => {
    startTransition(() => {
      setCalculatedResourceAmount(currentAmount);
    });

    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
    }

    if (hourlyProduction === 0) {
      return;
    }

    const updateResourceAmount = () => {
      const perTickAmount = hourlyProduction / 3600;

      startTransition(() => {
        setCalculatedResourceAmount((prevAmount) => {
          let newAmount =
            prevAmount + perTickAmount * secondsForResourceGeneration;

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

    const remainingTimeForNextUnit =
      secondsForResourceGeneration -
      (timeSinceLastUpdateInSeconds % secondsForResourceGeneration);

    timeoutId.current = window.setTimeout(() => {
      updateResourceAmount();
      intervalId.current = window.setInterval(
        updateResourceAmount,
        secondsForResourceGeneration * 1000,
      );
    }, remainingTimeForNextUnit * 1000);

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
      if (intervalId.current) {
        window.clearInterval(intervalId.current);
      }
    };
  }, [
    currentVillage.lastUpdatedAt,
    hourlyProduction,
    storageCapacity,
    secondsForResourceGeneration,
  ]);

  return {
    calculatedResourceAmount,
    hourlyProduction: Math.trunc(hourlyProduction),
    storageCapacity: Math.trunc(storageCapacity),
    isFull,
    hasNegativeProduction,
  };
};
