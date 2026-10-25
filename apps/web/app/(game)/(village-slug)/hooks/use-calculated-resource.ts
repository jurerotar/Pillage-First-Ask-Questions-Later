import { use, useSyncExternalStore } from 'react';
import type { Resource } from '@pillage-first/types/models/resource';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import { CurrentVillageLiveResourcesStoreContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';

export const useCalculatedResource = (resource: Resource) => {
  const {
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
    hourlyWoodProduction,
    hourlyClayProduction,
    hourlyIronProduction,
    hourlyWheatProduction,
  } = use(CurrentVillageComputedEffectsContext);

  const storageCapacity =
    resource === 'wheat'
      ? computedGranaryCapacityEffect.total
      : computedWarehouseCapacityEffect.total;

  const hourlyProduction = {
    wood: hourlyWoodProduction,
    clay: hourlyClayProduction,
    iron: hourlyIronProduction,
    wheat: hourlyWheatProduction,
  }[resource];

  const liveResourcesStore = use(CurrentVillageLiveResourcesStoreContext)!;

  const calculatedResourceAmount = useSyncExternalStore(
    liveResourcesStore.subscribe,
    () => liveResourcesStore.getSnapshot()[resource],
  );

  const hasNegativeProduction = hourlyProduction < 0;
  const isFull = calculatedResourceAmount === storageCapacity;

  return {
    calculatedResourceAmount,
    hourlyProduction,
    storageCapacity: Math.trunc(storageCapacity),
    isFull,
    hasNegativeProduction,
  };
};
