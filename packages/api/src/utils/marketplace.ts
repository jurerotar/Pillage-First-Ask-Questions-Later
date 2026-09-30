import { z } from 'zod';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import type { Resources } from '@pillage-first/types/models/resource';
import { speedSchema } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { calculateDistanceBetweenTiles } from '@pillage-first/utils/map';
import {
  selectMarketplaceVillageByIdQuery,
  selectMarketplaceVillageByTileIdQuery,
  selectMarketplaceVillageWithTargetByTileIdQuery,
  selectMerchantMovementStatsByVillageIdQuery,
  selectVillageMerchantStatsByTileIdQuery,
  selectVillageMerchantStatsByVillageIdQuery,
  selectVillageMerchantStatsWithTargetByTileIdQuery,
} from '../queries/marketplace-queries';
import { apiEffectSchema } from './zod/effect-schemas';

const marketplaceVillageSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  playerId: z.number(),
  tribe: tribeSchema,
});

const marketplaceVillageMerchantStatsSchema = marketplaceVillageSchema.extend({
  marketplaceLevel: z.number(),
  usedMerchantAmount: z.number(),
  effectsJson: z.string(),
});

const marketplaceVillageWithTargetSchema = marketplaceVillageSchema.extend({
  targetVillageId: z.number().nullable(),
  targetVillageTileId: z.number().nullable(),
});

const marketplaceVillageMerchantStatsWithTargetSchema =
  marketplaceVillageMerchantStatsSchema.extend({
    targetVillageId: z.number().nullable(),
    targetVillageTileId: z.number().nullable(),
  });

const getTargetVillageFromRow = (row: {
  targetVillageId: number | null;
  targetVillageTileId: number | null;
}) => {
  if (row.targetVillageId === null) {
    return;
  }

  return {
    id: row.targetVillageId,
    tileId: row.targetVillageTileId!,
  };
};

const getVillageMerchantStatsFromRow = (
  row: z.infer<typeof marketplaceVillageMerchantStatsSchema>,
) => {
  const village = {
    id: row.id,
    tileId: row.tileId,
    playerId: row.playerId,
    tribe: row.tribe,
  };
  const merchant = merchantsMap.get(village.tribe)!;

  return {
    village,
    merchant: {
      ...merchant,
      merchantCapacity: getMerchantCapacityFromStatsRow(row),
    },
    marketplaceLevel: row.marketplaceLevel,
    usedMerchantAmount: row.usedMerchantAmount,
  };
};

const getMerchantCapacityFromStatsRow = (
  row: z.infer<typeof marketplaceVillageMerchantStatsSchema>,
) => {
  const effects = z.array(apiEffectSchema).parse(JSON.parse(row.effectsJson));

  return calculateComputedEffect('merchantCapacity', effects, row.tileId).total;
};

export const getMarketplaceVillage = (
  database: DbFacade,
  villageId: Village['id'],
) =>
  database.selectObject({
    sql: selectMarketplaceVillageByIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: marketplaceVillageSchema,
  });

export const getMarketplaceVillageByTileId = (
  database: DbFacade,
  tileId: Village['tileId'],
) =>
  database.selectObject({
    sql: selectMarketplaceVillageByTileIdQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: marketplaceVillageSchema,
  });

export const getMarketplaceVillageWithTargetByTileId = (
  database: DbFacade,
  tileId: Village['tileId'],
  targetTileId: Village['tileId'],
) => {
  const row = database.selectObject({
    sql: selectMarketplaceVillageWithTargetByTileIdQuery,
    bind: {
      $tile_id: tileId,
      $target_tile_id: targetTileId,
    },
    schema: marketplaceVillageWithTargetSchema,
  })!;

  return {
    village: {
      id: row.id,
      tileId: row.tileId,
      playerId: row.playerId,
      tribe: row.tribe,
    },
    targetVillage: getTargetVillageFromRow(row),
  };
};

export const getMerchantAmount = (
  resources: Resources,
  merchantCapacity: number,
) => {
  return Math.ceil(getTotalResourceAmount(resources) / merchantCapacity);
};

export const getTotalResourceAmount = (resources: Resources) => {
  return resources.wood + resources.clay + resources.iron + resources.wheat;
};

export const getMerchantMovementDurationByVillageId = (
  database: DbFacade,
  villageId: Village['id'],
  originTileId: number,
  targetTileId: number,
) => {
  const { tribe, mapSize, speed } = database.selectObject({
    sql: selectMerchantMovementStatsByVillageIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      tribe: tribeSchema,
      mapSize: z.number(),
      speed: speedSchema,
    }),
  })!;
  const merchantSpeed = merchantsMap.get(tribe)!.merchantSpeed;

  const distance = calculateDistanceBetweenTiles(
    originTileId,
    targetTileId,
    mapSize,
  );

  return (distance / (merchantSpeed * speed)) * 3_600_000;
};

export const getVillageMerchantStats = (
  database: DbFacade,
  villageId: Village['id'],
) => {
  const stats = database.selectObject({
    sql: selectVillageMerchantStatsByVillageIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: marketplaceVillageMerchantStatsSchema,
  })!;

  return getVillageMerchantStatsFromRow(stats);
};

export const getVillageMerchantStatsByTileId = (
  database: DbFacade,
  tileId: Village['tileId'],
) => {
  const stats = database.selectObject({
    sql: selectVillageMerchantStatsByTileIdQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: marketplaceVillageMerchantStatsSchema,
  })!;

  return getVillageMerchantStatsFromRow(stats);
};

export const getVillageMerchantStatsWithTargetByTileId = (
  database: DbFacade,
  tileId: Village['tileId'],
  targetTileId: Village['tileId'],
) => {
  const row = database.selectObject({
    sql: selectVillageMerchantStatsWithTargetByTileIdQuery,
    bind: {
      $tile_id: tileId,
      $target_tile_id: targetTileId,
    },
    schema: marketplaceVillageMerchantStatsWithTargetSchema,
  })!;

  return {
    ...getVillageMerchantStatsFromRow(row),
    targetVillage: getTargetVillageFromRow(row),
  };
};
