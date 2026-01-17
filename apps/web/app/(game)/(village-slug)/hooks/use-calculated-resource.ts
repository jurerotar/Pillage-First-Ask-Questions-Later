import { useMemo, useSyncExternalStore } from 'react';
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
  const lastUpdatedAt = currentVillage.lastUpdatedAt;

  const subscribe = useMemo(() => {
    return (callback: () => void) => {
      if (hourlyProduction === 0) {
        return () => {};
      }

      const { timeSinceLastUpdateInSeconds, secondsForResourceGeneration } =
        calculateCurrentAmount({
          lastKnownResourceAmount,
          lastUpdatedAt,
          storageCapacity,
          hourlyProduction,
        });

      const remainingTimeForNextUnit =
        secondsForResourceGeneration -
        (timeSinceLastUpdateInSeconds % secondsForResourceGeneration);

      const timeoutId = window.setTimeout(() => {
        callback();
        const intervalId = window.setInterval(
          callback,
          secondsForResourceGeneration * 1000,
        );
        return () => window.clearInterval(intervalId);
      }, remainingTimeForNextUnit * 1000);

      return () => {
        window.clearTimeout(timeoutId);
      };
    };
  }, [
    lastKnownResourceAmount,
    lastUpdatedAt,
    storageCapacity,
    hourlyProduction,
  ]);

  const getSnapshot = () => {
    const { currentAmount } = calculateCurrentAmount({
      lastKnownResourceAmount,
      lastUpdatedAt,
      storageCapacity,
      hourlyProduction,
    });
    return currentAmount;
  };

  const calculatedResourceAmount = useSyncExternalStore(subscribe, getSnapshot);

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  return {
    calculatedResourceAmount,
    hourlyProduction: Math.trunc(hourlyProduction),
    storageCapacity: Math.trunc(storageCapacity),
    isFull,
    hasNegativeProduction,
  };
};
