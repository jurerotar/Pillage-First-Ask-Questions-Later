import { use, useSyncExternalStore } from 'react';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import type { Resource } from '@pillage-first/types/models/resource';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { CurrentVillageLiveResourcesStoreContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';

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
  const { total: hourlyProduction } = useComputedEffect(
    resourceToResourceEffectMap.get(resource)!,
  );
  const liveResourcesStore = use(CurrentVillageLiveResourcesStoreContext)!;

  const calculatedResourceAmount = useSyncExternalStore(
    liveResourcesStore.subscribe,
    () => liveResourcesStore.getSnapshot()[resource],
  );

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
