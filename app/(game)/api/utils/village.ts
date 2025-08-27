import type { QueryClient } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import {
  effectsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import type { Database } from 'app/interfaces/db';

export const calculateVillageResourcesAt = (
  queryClient: QueryClient,
  _database: Database,
  villageId: Village['id'],
  timestamp: number,
) => {
  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const village = villages.find(({ id }) => id === villageId)!;

  const { total: warehouseCapacity } = calculateComputedEffect(
    'warehouseCapacity',
    effects,
    villageId,
  );
  const { total: granaryCapacity } = calculateComputedEffect(
    'granaryCapacity',
    effects,
    villageId,
  );
  const { total: woodProduction } = calculateComputedEffect(
    'woodProduction',
    effects,
    villageId,
  );
  const { total: clayProduction } = calculateComputedEffect(
    'clayProduction',
    effects,
    villageId,
  );
  const { total: ironProduction } = calculateComputedEffect(
    'ironProduction',
    effects,
    villageId,
  );
  const { total: wheatProduction } = calculateComputedEffect(
    'wheatProduction',
    effects,
    villageId,
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
  database: Database,
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
  } = calculateVillageResourcesAt(queryClient, database, villageId, timestamp);

  const latestTick = Math.max(
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  );

  database.exec({
    sql: `
      UPDATE resource_sites
      SET wood       = $wood,
          clay       = $clay,
          iron       = $iron,
          wheat      = $wheat,
          updated_at = $updated_at
      WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
    `,
    bind: {
      $village_id: villageId,
      $wood: currentWood,
      $clay: currentClay,
      $iron: currentIron,
      $wheat: currentWheat,
      $updated_at: latestTick,
    },
  });

  // Keep UI cache in sync
  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) =>
    prevVillages!.map((village) =>
      village.id !== villageId
        ? village
        : {
            ...village,
            lastUpdatedAt: latestTick,
            resources: {
              wood: currentWood,
              clay: currentClay,
              iron: currentIron,
              wheat: currentWheat,
            },
          },
    ),
  );
};

export const addVillageResourcesAt = (
  queryClient: QueryClient,
  database: Database,
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
  } = calculateVillageResourcesAt(queryClient, database, villageId, timestamp);

  const [addWood, addClay, addIron, addWheat] = resourcesToAdd;

  const newWood = Math.min(currentWood + addWood, warehouseCapacity);
  const newClay = Math.min(currentClay + addClay, warehouseCapacity);
  const newIron = Math.min(currentIron + addIron, warehouseCapacity);
  const newWheat = Math.min(currentWheat + addWheat, granaryCapacity);

  database.exec({
    sql: `
      UPDATE resource_sites
      SET wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat,
          updated_at = $ts
      WHERE tile_id = (
        SELECT tile_id FROM villages WHERE id = $village_id
      );
    `,
    bind: {
      $village_id: villageId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $ts: timestamp,
    },
  });

  // Optimistic cache update to keep UI in sync
  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) =>
    prevVillages!.map((v) =>
      v.id !== villageId
        ? v
        : {
            ...v,
            lastUpdatedAt: timestamp,
            resources: {
              wood: newWood,
              clay: newClay,
              iron: newIron,
              wheat: newWheat,
            },
          },
    ),
  );
};

export const subtractVillageResourcesAt = (
  queryClient: QueryClient,
  database: Database,
  villageId: Village['id'],
  timestamp: number,
  resourcesToSubtract: number[],
) => {
  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(queryClient, database, villageId, timestamp);

  const [subWood, subClay, subIron, subWheat] = resourcesToSubtract;

  const newWood = Math.max(currentWood - subWood, 0);
  const newClay = Math.max(currentClay - subClay, 0);
  const newIron = Math.max(currentIron - subIron, 0);
  const newWheat = Math.max(currentWheat - subWheat, 0);

  database.exec({
    sql: `
      UPDATE resource_sites
      SET wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat,
          updated_at = $ts
      WHERE tile_id = (
        SELECT tile_id FROM villages WHERE id = $village_id
      );
    `,
    bind: {
      $village_id: villageId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $ts: timestamp,
    },
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevVillages) => {
    return prevVillages!.map((village) => {
      if (village.id !== villageId) {
        return village;
      }

      return {
        ...village,
        lastUpdatedAt: timestamp,
        resources: {
          wood: newWood,
          clay: newClay,
          iron: newIron,
          wheat: newWheat,
        },
      };
    });
  });
};
