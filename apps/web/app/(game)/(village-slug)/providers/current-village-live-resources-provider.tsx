import {
  type PropsWithChildren,
  use,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { Resources } from '@pillage-first/types/models/resource';
import { calculateCurrentAmount } from '@pillage-first/utils/game/calculate-current-resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageComputedEffectsContext } from 'app/(game)/(village-slug)/providers/current-village-computed-effects-context';
import {
  CurrentVillageLiveResourcesSnapshotContext,
  type CurrentVillageLiveResourcesStore,
  CurrentVillageLiveResourcesStoreContext,
} from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';

type LiveResourcesInput = {
  resources: Resources;
  lastUpdatedAt: number;
  warehouseCapacity: number;
  granaryCapacity: number;
  hourlyWoodProduction: number;
  hourlyClayProduction: number;
  hourlyIronProduction: number;
  hourlyWheatProduction: number;
};

const createLiveResourcesStore = (
  input: LiveResourcesInput,
): CurrentVillageLiveResourcesStore => {
  let snapshot: Resources | null = null;
  let snapshotTimestamp: number | null = null;

  return {
    subscribe: subscribeToTimer,
    getSnapshot: () => {
      const timestamp = getCurrentTime();
      if (snapshot !== null && snapshotTimestamp === timestamp) {
        return snapshot;
      }

      const { resources, lastUpdatedAt } = input;
      const nextSnapshot = {
        wood: calculateCurrentAmount({
          lastKnownResourceAmount: resources.wood,
          lastUpdatedAt,
          hourlyProduction: input.hourlyWoodProduction,
          storageCapacity: input.warehouseCapacity,
          timestamp,
        }).currentAmount,
        clay: calculateCurrentAmount({
          lastKnownResourceAmount: resources.clay,
          lastUpdatedAt,
          hourlyProduction: input.hourlyClayProduction,
          storageCapacity: input.warehouseCapacity,
          timestamp,
        }).currentAmount,
        iron: calculateCurrentAmount({
          lastKnownResourceAmount: resources.iron,
          lastUpdatedAt,
          hourlyProduction: input.hourlyIronProduction,
          storageCapacity: input.warehouseCapacity,
          timestamp,
        }).currentAmount,
        wheat: calculateCurrentAmount({
          lastKnownResourceAmount: resources.wheat,
          lastUpdatedAt,
          hourlyProduction: input.hourlyWheatProduction,
          storageCapacity: input.granaryCapacity,
          timestamp,
        }).currentAmount,
      };

      snapshotTimestamp = timestamp;
      if (
        snapshot !== null &&
        snapshot.wood === nextSnapshot.wood &&
        snapshot.clay === nextSnapshot.clay &&
        snapshot.iron === nextSnapshot.iron &&
        snapshot.wheat === nextSnapshot.wheat
      ) {
        return snapshot;
      }

      snapshot = nextSnapshot;
      return snapshot;
    },
  };
};

// Only this bridge renders on resource ticks. The input provider stays stable.
const LiveResourcesSnapshotProvider = ({ children }: PropsWithChildren) => {
  const store = use(CurrentVillageLiveResourcesStoreContext)!;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return (
    <CurrentVillageLiveResourcesSnapshotContext value={snapshot}>
      {children}
    </CurrentVillageLiveResourcesSnapshotContext>
  );
};

export const CurrentVillageLiveResourcesProvider = ({
  children,
}: PropsWithChildren) => {
  const { currentVillage } = useCurrentVillage();
  const { wood, clay, iron, wheat } = currentVillage.resources;
  const { lastUpdatedAt } = currentVillage;
  const {
    computedWarehouseCapacityEffect: { total: warehouseCapacity },
    computedGranaryCapacityEffect: { total: granaryCapacity },
    hourlyWoodProduction,
    hourlyClayProduction,
    hourlyIronProduction,
    hourlyWheatProduction,
  } = use(CurrentVillageComputedEffectsContext);

  const store = useMemo(
    () =>
      createLiveResourcesStore({
        resources: { wood, clay, iron, wheat },
        lastUpdatedAt,
        warehouseCapacity,
        granaryCapacity,
        hourlyWoodProduction,
        hourlyClayProduction,
        hourlyIronProduction,
        hourlyWheatProduction,
      }),
    [
      wood,
      clay,
      iron,
      wheat,
      lastUpdatedAt,
      warehouseCapacity,
      granaryCapacity,
      hourlyWoodProduction,
      hourlyClayProduction,
      hourlyIronProduction,
      hourlyWheatProduction,
    ],
  );

  return (
    <CurrentVillageLiveResourcesStoreContext value={store}>
      <LiveResourcesSnapshotProvider>{children}</LiveResourcesSnapshotProvider>
    </CurrentVillageLiveResourcesStoreContext>
  );
};
