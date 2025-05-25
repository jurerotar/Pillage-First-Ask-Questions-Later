import type { QueryClient } from '@tanstack/react-query';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { effectsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';

export const getCurrentVillageResources = (queryClient: QueryClient, villageId: PlayerVillage['id'], timestamp: number = Date.now()) => {
  const villages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
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
  };
};

export const updateVillageResources = (
  queryClient: QueryClient,
  villageId: PlayerVillage['id'],
  [wood, clay, iron, wheat]: number[],
  mode: 'add' | 'subtract',
) => {
  const { currentWood, currentClay, currentIron, currentWheat, warehouseCapacity, granaryCapacity } = getCurrentVillageResources(
    queryClient,
    villageId,
  );

  const newLastUpdatedAt = Date.now();

  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      if (mode === 'add') {
        return {
          ...village,
          resources: {
            wood: Math.min(currentWood + wood, warehouseCapacity),
            clay: Math.min(currentClay + clay, warehouseCapacity),
            iron: Math.min(currentIron + iron, warehouseCapacity),
            wheat: Math.min(currentWheat + wheat, granaryCapacity),
          },
          lastUpdatedAt: newLastUpdatedAt,
        };
      }

      return {
        ...village,
        resources: {
          wood: Math.max(currentWood - wood, 0),
          clay: Math.max(currentClay - clay, 0),
          iron: Math.max(currentIron - iron, 0),
          wheat: Math.max(currentWheat - wheat, 0),
        },
        lastUpdatedAt: newLastUpdatedAt,
      };
    });
  });
};
