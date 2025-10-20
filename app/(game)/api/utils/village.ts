import type { Village, VillageModel } from 'app/interfaces/models/game/village';
import type { Effect } from 'app/interfaces/models/game/effect';
import { calculateCurrentAmount } from 'app/(game)/utils/calculate-current-resources';
import { calculateComputedEffect } from 'app/(game)/utils/calculate-computed-effect';
import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import { selectAllRelevantEffectsQuery } from 'app/(game)/api/utils/queries/effect-queries';

export const demolishBuilding = (
  database: DbFacade,
  villageId: number,
  buildingFieldId: number,
): void => {
  // If buildingFieldId is 1-18 (resource fields) or 39 (rally point) or 40 (wall),
  // we just set it to level 1, since these buildings can't be destroyed
  database.exec(
    `
      UPDATE building_fields
      SET level = 0
      WHERE village_id = $village_id
        AND field_id = $building_field_id
        AND (field_id BETWEEN 1 AND 18 OR field_id IN (39, 40));
    `,
    {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  );

  database.exec(
    `
      DELETE
      FROM building_fields
      WHERE village_id = $village_id
        AND field_id = $building_field_id
        AND field_id BETWEEN 19 AND 38;
    `,
    {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  );
};

export const calculateVillageResourcesAt = (
  database: DbFacade,
  villageId: Village['id'],
  timestamp: number,
) => {
  const effects = database.selectObjects(selectAllRelevantEffectsQuery, {
    $village_id: villageId,
  }) as Effect[];

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

  const { wood, clay, iron, wheat, last_updated_at } = database.selectObject(
    `
      SELECT rs.updated_at AS last_updated_at,
             rs.wood       AS wood,
             rs.clay       AS clay,
             rs.iron       AS iron,
             rs.wheat      AS wheat
      FROM villages v
             JOIN tiles t
                  ON t.id = v.tile_id
             LEFT JOIN resource_sites rs
                       ON rs.tile_id = v.tile_id
      WHERE v.id = $village_id;
    `,
    { $village_id: villageId },
  ) as Pick<
    VillageModel,
    'wood' | 'clay' | 'iron' | 'wheat' | 'last_updated_at'
  >;

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
  };
};

export const updateVillageResourcesAt = (
  database: DbFacade,
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
  } = calculateVillageResourcesAt(database, villageId, timestamp);

  const latestTick = Math.max(
    lastEffectiveWoodUpdate,
    lastEffectiveClayUpdate,
    lastEffectiveIronUpdate,
    lastEffectiveWheatUpdate,
  );

  database.exec(
    `
      UPDATE resource_sites
      SET wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat,
          updated_at = $updated_at
      WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
    `,
    {
      $village_id: villageId,
      $wood: currentWood,
      $clay: currentClay,
      $iron: currentIron,
      $wheat: currentWheat,
      $updated_at: latestTick,
    },
  );
};

export const addVillageResourcesAt = (
  database: DbFacade,
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
  } = calculateVillageResourcesAt(database, villageId, timestamp);

  const [addWood, addClay, addIron, addWheat] = resourcesToAdd;

  const newWood = Math.min(currentWood + addWood, warehouseCapacity);
  const newClay = Math.min(currentClay + addClay, warehouseCapacity);
  const newIron = Math.min(currentIron + addIron, warehouseCapacity);
  const newWheat = Math.min(currentWheat + addWheat, granaryCapacity);

  database.exec(
    `
      UPDATE resource_sites
      SET wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat,
          updated_at = $ts
      WHERE tile_id = (SELECT tile_id
                       FROM villages
                       WHERE id = $village_id);
    `,
    {
      $village_id: villageId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $ts: timestamp,
    },
  );
};

export const subtractVillageResourcesAt = (
  database: DbFacade,
  villageId: Village['id'],
  timestamp: number,
  resourcesToSubtract: number[],
) => {
  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(database, villageId, timestamp);

  const [subWood, subClay, subIron, subWheat] = resourcesToSubtract;

  const newWood = Math.max(currentWood - subWood, 0);
  const newClay = Math.max(currentClay - subClay, 0);
  const newIron = Math.max(currentIron - subIron, 0);
  const newWheat = Math.max(currentWheat - subWheat, 0);

  database.exec(
    `
      UPDATE resource_sites
      SET wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat,
          updated_at = $ts
      WHERE tile_id = (SELECT tile_id
                       FROM villages
                       WHERE id = $village_id);
    `,
    {
      $village_id: villageId,
      $wood: newWood,
      $clay: newClay,
      $iron: newIron,
      $wheat: newWheat,
      $ts: timestamp,
    },
  );
};
