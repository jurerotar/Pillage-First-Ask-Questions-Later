import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import type { ResourceProductionEffectId } from 'app/interfaces/models/game/effect';
import type { Resource } from 'app/interfaces/models/game/resource';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';

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
    // @ts-expect-error: TODO: Overload issue, fix when you can
    resourceToResourceEffectMap.get(resource)!,
  );

  const timeoutId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);

  const {
    timeSinceLastUpdateInSeconds,
    secondsForResourceGeneration,
    currentAmount,
  } = calculateCurrentAmount({
    village: currentVillage,
    resource,
    storageCapacity,
    hourlyProduction,
  });

  const [calculatedResourceAmount, setCalculatedResourceAmount] =
    useState<number>(currentAmount);

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  const resourceDepletionOrFullAt = useMemo<number | null>(() => {
    if (hourlyProduction > 0 && !isFull) {
      const secondsToFull =
        (storageCapacity - currentAmount) / (hourlyProduction / 3600);
      return new Date(Date.now() + secondsToFull * 1000).getTime();
    }
    if (hourlyProduction < 0 && currentAmount > 0) {
      const secondsToEmpty = currentAmount / Math.abs(hourlyProduction / 3600);
      return new Date(Date.now() + secondsToEmpty * 1000).getTime();
    }
    return null; // Neither fills nor depletes
  }, [hourlyProduction, currentAmount, storageCapacity, isFull]);

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
    hourlyProduction,
    storageCapacity,
    isFull,
    hasNegativeProduction,
    resourceDepletionOrFullAt,
  };
};
