import type { QueryClient } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { effectsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';

export const calculateVillageResourcesAt = (queryClient: QueryClient, villageId: PlayerVillage['id'], timestamp: number) => {
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  const villages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
  const village = villages.find(({ id }) => id === villageId)!;
  const { id } = village;

  const { total: warehouseCapacity } = calculateComputedEffect('warehouseCapacity', effects, id);
  const { total: granaryCapacity } = calculateComputedEffect('granaryCapacity', effects, id);
  const { total: woodProduction } = calculateComputedEffect('woodProduction', effects, id);
  const { total: clayProduction } = calculateComputedEffect('clayProduction', effects, id);
  const { total: ironProduction } = calculateComputedEffect('ironProduction', effects, id);
  const { total: wheatProduction } = calculateComputedEffect('wheatProduction', effects, id);

  const { currentAmount: currentWood } = calculateCurrentAmount({
    village,
    resource: 'wood',
    hourlyProduction: woodProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentClay } = calculateCurrentAmount({
    village,
    resource: 'clay',
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentIron } = calculateCurrentAmount({
    village,
    resource: 'iron',
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const { currentAmount: currentWheat } = calculateCurrentAmount({
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
  };
};

export const updateVillageResourcesAt = (queryClient: QueryClient, villageId: PlayerVillage['id'], timestamp: number) => {
  const { currentWood, currentClay, currentIron, currentWheat } = calculateVillageResourcesAt(queryClient, villageId, timestamp);

  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      return {
        ...village,
        lastUpdatedAt: timestamp,
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
  villageId: PlayerVillage['id'],
  timestamp: number,
  resourcesToAdd: number[],
) => {
  const { currentWood, currentClay, currentIron, currentWheat, warehouseCapacity, granaryCapacity } = calculateVillageResourcesAt(
    queryClient,
    villageId,
    timestamp,
  );

  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      const [wood, iron, clay, wheat] = resourcesToAdd;

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
  villageId: PlayerVillage['id'],
  timestamp: number,
  resourcesToSubtract: number[],
) => {
  const { currentWood, currentClay, currentIron, currentWheat } = calculateVillageResourcesAt(queryClient, villageId, timestamp);

  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      const [wood, iron, clay, wheat] = resourcesToSubtract;

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
