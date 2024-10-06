import type { QueryClient } from '@tanstack/react-query';
import { calculateCurrentAmount } from 'app/(game)/hooks/use-calculated-resource';
import { calculateComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { effectsCacheKey } from 'app/(game)/hooks/use-effects';
import { getVillageById, villagesCacheKey } from 'app/(game)/hooks/use-villages';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';

export const getCurrentVillageResources = (queryClient: QueryClient, villageId: Village['id']) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
  const village = getVillageById(villages, villageId);
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
  });
  const { currentAmount: currentClay } = calculateCurrentAmount({
    village,
    resource: 'clay',
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
  });
  const { currentAmount: currentIron } = calculateCurrentAmount({
    village,
    resource: 'iron',
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
  });
  const { currentAmount: currentWheat } = calculateCurrentAmount({
    village,
    resource: 'wheat',
    hourlyProduction: wheatProduction,
    storageCapacity: granaryCapacity,
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
  villageId: Village['id'],
  [wood, clay, iron, wheat]: number[],
  mode: 'add' | 'subtract',
) => {
  const { currentWood, currentClay, currentIron, currentWheat, warehouseCapacity, granaryCapacity } = getCurrentVillageResources(
    queryClient,
    villageId,
  );

  const newLastUpdatedAt = Date.now();

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
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
