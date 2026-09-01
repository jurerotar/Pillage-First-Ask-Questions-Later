import { z } from 'zod';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { calculateCurrentAmount } from '@pillage-first/utils/game/calculate-current-resources';
import { selectResourceSiteResourcesRelevantEffectsByTileIdQuery } from '../queries/effect-queries';
import { updateResourceSiteResourcesByTileIdToValuesQuery } from '../queries/village-queries';
import { apiEffectSchema } from './zod/effect-schemas';

export const demolishBuilding = (
  database: DbFacade,
  villageId: number,
  buildingFieldId: number,
): void => {
  // If buildingFieldId is 1-18 (resource fields) or 39 (rally point) or 40 (wall),
  // we just set it to level 1, since these buildings can't be destroyed
  database.exec({
    sql: `
      UPDATE building_fields
      SET
        level = 0
      WHERE
        village_id = $village_id
        AND field_id = $building_field_id
        AND (field_id BETWEEN 1 AND 18 OR field_id IN (39, 40));
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  });

  database.exec({
    sql: `
      DELETE
      FROM
        building_fields
      WHERE
        village_id = $village_id
        AND field_id = $building_field_id
        AND field_id BETWEEN 19 AND 38;
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  });
};

type CalculateResourceSiteResourcesAtReturn = {
  currentWood: number;
  currentIron: number;
  currentClay: number;
  currentWheat: number;
  warehouseCapacity: number;
  granaryCapacity: number;
  timestamp: number;
  lastEffectiveWoodUpdate: number;
  lastEffectiveClayUpdate: number;
  lastEffectiveIronUpdate: number;
  lastEffectiveWheatUpdate: number;
  previousWood: number;
  previousClay: number;
  previousIron: number;
  previousWheat: number;
  previousUpdatedAt: number;
};

export const getVillageTileId = (
  database: DbFacade,
  villageId: number,
): number =>
  database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;

export const calculateResourceSiteResourcesAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
): CalculateResourceSiteResourcesAtReturn => {
  const effects = database.selectObjects({
    sql: selectResourceSiteResourcesRelevantEffectsByTileIdQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: apiEffectSchema,
  });

  const { total: warehouseCapacity } = calculateComputedEffect(
    'warehouseCapacity',
    effects,
    tileId,
  );
  const { total: granaryCapacity } = calculateComputedEffect(
    'granaryCapacity',
    effects,
    tileId,
  );
  const { total: woodProduction } = calculateComputedEffect(
    'woodProduction',
    effects,
    tileId,
  );
  const { total: clayProduction } = calculateComputedEffect(
    'clayProduction',
    effects,
    tileId,
  );
  const { total: ironProduction } = calculateComputedEffect(
    'ironProduction',
    effects,
    tileId,
  );
  const { total: wheatProduction } = calculateComputedEffect(
    'wheatProduction',
    effects,
    tileId,
  );

  const { wood, clay, iron, wheat, last_updated_at } = database.selectObject({
    sql: `
      SELECT
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat
      FROM
        resource_sites rs
      WHERE
        rs.tile_id = $tile_id;
    `,
    bind: { $tile_id: tileId },
    schema: resourcesSchema.extend({
      last_updated_at: z.number(),
    }),
  })!;

  const {
    currentAmount: currentWood,
    lastEffectiveUpdate: lastEffectiveWoodUpdate,
  } = calculateCurrentAmount({
    lastKnownResourceAmount: wood,
    lastUpdatedAt: last_updated_at,
    hourlyProduction: woodProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentClay,
    lastEffectiveUpdate: lastEffectiveClayUpdate,
  } = calculateCurrentAmount({
    lastKnownResourceAmount: clay,
    lastUpdatedAt: last_updated_at,
    hourlyProduction: clayProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentIron,
    lastEffectiveUpdate: lastEffectiveIronUpdate,
  } = calculateCurrentAmount({
    lastKnownResourceAmount: iron,
    lastUpdatedAt: last_updated_at,
    hourlyProduction: ironProduction,
    storageCapacity: warehouseCapacity,
    timestamp,
  });
  const {
    currentAmount: currentWheat,
    lastEffectiveUpdate: lastEffectiveWheatUpdate,
  } = calculateCurrentAmount({
    lastKnownResourceAmount: wheat,
    lastUpdatedAt: last_updated_at,
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
    previousWood: wood,
    previousClay: clay,
    previousIron: iron,
    previousWheat: wheat,
    previousUpdatedAt: last_updated_at,
  };
};

export const updateResourceSiteResourcesAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
): void => {
  const {
    currentWood,
    currentClay,
    currentIron,
    currentWheat,
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
    previousWood,
    previousClay,
    previousIron,
    previousWheat,
    previousUpdatedAt,
  } = calculateResourceSiteResourcesAt(database, tileId, timestamp);

  const latestTick = Math.max(
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  );

  const hasChanges =
    currentWood !== previousWood ||
    currentClay !== previousClay ||
    currentIron !== previousIron ||
    currentWheat !== previousWheat ||
    latestTick !== previousUpdatedAt;

  if (!hasChanges) {
    return;
  }

  database.exec({
    sql: updateResourceSiteResourcesByTileIdToValuesQuery,
    bind: {
      $tile_id: tileId,
      $wood: currentWood,
      $clay: currentClay,
      $iron: currentIron,
      $wheat: currentWheat,
      $updated_at: latestTick,
    },
  });
};

export const addResourceSiteResourcesAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
  resourcesToAdd: number[],
): void => {
  const {
    currentWood,
    currentClay,
    currentIron,
    currentWheat,
    warehouseCapacity,
    granaryCapacity,
  } = calculateResourceSiteResourcesAt(database, tileId, timestamp);

  const [addWood, addClay, addIron, addWheat] = resourcesToAdd;

  const newWood = Math.min(currentWood + addWood, warehouseCapacity);
  const newClay = Math.min(currentClay + addClay, warehouseCapacity);
  const newIron = Math.min(currentIron + addIron, warehouseCapacity);
  const newWheat = Math.min(currentWheat + addWheat, granaryCapacity);

  database.exec({
    sql: updateResourceSiteResourcesByTileIdToValuesQuery,
    bind: {
      $tile_id: tileId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $updated_at: timestamp,
    },
  });
};

export const subtractResourceSiteResourcesAt = <
  ResourcesToSubtract extends readonly number[],
>(
  database: DbFacade,
  tileId: number,
  timestamp: number,
  getResourcesToSubtract: (
    currentResources: CalculateResourceSiteResourcesAtReturn,
  ) => ResourcesToSubtract,
): ResourcesToSubtract => {
  const currentResources = calculateResourceSiteResourcesAt(
    database,
    tileId,
    timestamp,
  );
  const { currentWood, currentClay, currentIron, currentWheat } =
    currentResources;

  const resourcesToSubtract = getResourcesToSubtract(currentResources);

  const [subWood = 0, subClay = 0, subIron = 0, subWheat = 0] =
    resourcesToSubtract;

  const newWood = Math.max(currentWood - subWood, 0);
  const newClay = Math.max(currentClay - subClay, 0);
  const newIron = Math.max(currentIron - subIron, 0);
  const newWheat = Math.max(currentWheat - subWheat, 0);

  database.exec({
    sql: updateResourceSiteResourcesByTileIdToValuesQuery,
    bind: {
      $tile_id: tileId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $updated_at: timestamp,
    },
  });

  return resourcesToSubtract;
};
