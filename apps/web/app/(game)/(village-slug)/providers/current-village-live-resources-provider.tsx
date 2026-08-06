import {
  type PropsWithChildren,
  use,
  useRef,
  useSyncExternalStore,
} from 'react';
import type { Resources } from '@pillage-first/types/models/resource';
import { calculateCurrentAmount } from '@pillage-first/utils/game/calculate-current-resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';

export const CurrentVillageLiveResourcesProvider = ({
  children,
}: PropsWithChildren) => {
  const { currentVillage } = useCurrentVillage();
  const {
    computedWarehouseCapacityEffect,
    computedGranaryCapacityEffect,
    hourlyWoodProduction,
    hourlyClayProduction,
    hourlyIronProduction,
    hourlyWheatProduction,
  } = use(CurrentVillageComputedEffectsContext);
  const snapshotRef = useRef<Resources | null>(null);

  const getSnapshot = () => {
    const timestamp = getCurrentTime();
    const lastUpdatedAt = currentVillage.lastUpdatedAt;
    const { resources } = currentVillage;
    const warehouseCapacity = computedWarehouseCapacityEffect.total;
    const granaryCapacity = computedGranaryCapacityEffect.total;

    const nextSnapshot = {
      wood: calculateCurrentAmount({
        lastKnownResourceAmount: resources.wood,
        lastUpdatedAt,
        hourlyProduction: hourlyWoodProduction,
        storageCapacity: warehouseCapacity,
        timestamp,
      }).currentAmount,
      clay: calculateCurrentAmount({
        lastKnownResourceAmount: resources.clay,
        lastUpdatedAt,
        hourlyProduction: hourlyClayProduction,
        storageCapacity: warehouseCapacity,
        timestamp,
      }).currentAmount,
      iron: calculateCurrentAmount({
        lastKnownResourceAmount: resources.iron,
        lastUpdatedAt,
        hourlyProduction: hourlyIronProduction,
        storageCapacity: warehouseCapacity,
        timestamp,
      }).currentAmount,
      wheat: calculateCurrentAmount({
        lastKnownResourceAmount: resources.wheat,
        lastUpdatedAt,
        hourlyProduction: hourlyWheatProduction,
        storageCapacity: granaryCapacity,
        timestamp,
      }).currentAmount,
    };

    const previousSnapshot = snapshotRef.current;

    if (
      previousSnapshot !== null &&
      previousSnapshot.wood === nextSnapshot.wood &&
      previousSnapshot.clay === nextSnapshot.clay &&
      previousSnapshot.iron === nextSnapshot.iron &&
      previousSnapshot.wheat === nextSnapshot.wheat
    ) {
      return previousSnapshot;
    }

    snapshotRef.current = nextSnapshot;

    return nextSnapshot;
  };

  const liveResourcesValue = useSyncExternalStore(
    subscribeToTimer,
    getSnapshot,
  );

  return (
    <CurrentVillageLiveResourcesContext value={liveResourcesValue}>
      {children}
    </CurrentVillageLiveResourcesContext>
  );
};
