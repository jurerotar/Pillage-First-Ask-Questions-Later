import type { QueryClient } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import {
  effectsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';

export const calculateVillageResourcesAt = (
  queryClient: QueryClient,
  villageId: Village['id'],
  timestamp: number,
) => {
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const village = villages.find(({ id }) => id === villageId)!;
  const { id } = village;

  const { total: warehouseCapacity } = calculateComputedEffect(
    'warehouseCapacity',
    effects,
    id,
  );
  const { total: granaryCapacity } = calculateComputedEffect(
    'granaryCapacity',
    effects,
    id,
  );
  const { total: woodProduction } = calculateComputedEffect(
    'woodProduction',
    effects,
    id,
  );
  const { total: clayProduction } = calculateComputedEffect(
    'clayProduction',
    effects,
    id,
  );
  const { total: ironProduction } = calculateComputedEffect(
    'ironProduction',
    effects,
    id,
  );
  const { total: wheatProduction } = calculateComputedEffect(
    'wheatProduction',
    effects,
    id,
  );

  const {
    currentAmount: currentWood,
    lastEffectiveUpdate: lastEffectiveWoodUpdate,
  } = calculateCurrentAmount({
    village,
    resource: 'wood',
    hourlyProduction: woodProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentClay,
    lastEffectiveUpdate: lastEffectiveClayUpdate,
  } = calculateCurrentAmount({
    village,
    resource: 'clay',
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentIron,
    lastEffectiveUpdate: lastEffectiveIronUpdate,
  } = calculateCurrentAmount({
    village,
    resource: 'iron',
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentWheat,
    lastEffectiveUpdate: lastEffectiveWheatUpdate,
  } = calculateCurrentAmount({
    village,
    resource: 'wheat',
    hourlyProduction: wheatProduction,
    storageCapacity: granaryCapacity,
    timestamp,
  });

  return {
    currentWood,
    currentIron,
    currentClay,
    currentWheat,
    warehouseCapacity,
    granaryCapacity,
    timestamp,
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  };
};

export const updateVillageResourcesAt = (
  queryClient: QueryClient,
  villageId: Village['id'],
  timestamp: number,
) => {
  const {
    currentWood,
    currentClay,
    currentIron,
    currentWheat,
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  } = calculateVillageResourcesAt(queryClient, villageId, timestamp);

  const latestTick = Math.max(
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  );

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      return {
        ...village,
        lastUpdatedAt: latestTick,
        resources: {
          wood: currentWood,
          clay: currentClay,
          iron: currentIron,
          wheat: currentWheat,
        },
      };
    });
  });
};

export const addVillageResourcesAt = (
  queryClient: QueryClient,
  villageId: Village['id'],
  timestamp: number,
  resourcesToAdd: number[],
) => {
  const {
    currentWood,
    currentClay,
    currentIron,
    currentWheat,
    warehouseCapacity,
    granaryCapacity,
  } = calculateVillageResourcesAt(queryClient, villageId, timestamp);

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      const [wood, clay, iron, wheat] = resourcesToAdd;

      return {
        ...village,
        lastUpdatedAt: timestamp,
        resources: {
          wood: Math.min(currentWood + wood, warehouseCapacity),
          clay: Math.min(currentClay + clay, warehouseCapacity),
          iron: Math.min(currentIron + iron, warehouseCapacity),
          wheat: Math.min(currentWheat + wheat, granaryCapacity),
        },
      };
    });
  });
};

export const subtractVillageResourcesAt = (
  queryClient: QueryClient,
  villageId: Village['id'],
  timestamp: number,
  resourcesToSubtract: number[],
) => {
  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(queryClient, villageId, timestamp);

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      const [wood, clay, iron, wheat] = resourcesToSubtract;

      return {
        ...village,
        lastUpdatedAt: timestamp,
        resources: {
          wood: Math.max(currentWood - wood, 0),
          clay: Math.max(currentClay - clay, 0),
          iron: Math.max(currentIron - iron, 0),
          wheat: Math.max(currentWheat - wheat, 0),
        },
      };
    });
  });
};
