import { z } from 'zod';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import type { Resources } from '@pillage-first/types/models/resource';
import { speedSchema } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateDistanceBetweenTiles } from '@pillage-first/utils/map';
import { selectVillageBuildingLevelQuery } from '../queries/village-queries';

const marketplaceVillageSchema = z.strictObject({
  id: z.number(),
  tileId: z.number(),
  playerId: z.number(),
  tribe: tribeSchema,
});

export const getMarketplaceVillage = (
  database: DbFacade,
  villageId: Village['id'],
) =>
  database.selectObject({
    sql: `
      SELECT
        v.id,
        v.tile_id AS tileId,
        v.player_id AS playerId,
        ti.tribe
      FROM
        villages v
          JOIN players p ON p.id = v.player_id
          JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE
        v.id = $village_id;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: marketplaceVillageSchema,
  });

export const getMarketplaceLevel = (
  database: DbFacade,
  villageId: Village['id'],
) =>
  database.selectValue({
    sql: selectVillageBuildingLevelQuery,
    bind: {
      $village_id: villageId,
      $building_id: 'MARKETPLACE',
    },
    schema: z.number().nullable(),
  }) ?? 0;

export const getUsedMerchantAmount = (
  database: DbFacade,
  villageId: Village['id'],
) =>
  database.selectValue({
    sql: `
      SELECT COALESCE(SUM(CAST(JSON_EXTRACT(meta, '$.merchantAmount') AS INTEGER)), 0)
      FROM
        events
      WHERE
        village_id = $village_id
        AND type = 'resourceTransfer';
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.number(),
  })!;

export const getFreeMerchantAmount = (
  database: DbFacade,
  villageId: Village['id'],
) => {
  return (
    getMarketplaceLevel(database, villageId) -
    getUsedMerchantAmount(database, villageId)
  );
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

export const getMerchantMovementDuration = (
  database: DbFacade,
  originTileId: number,
  targetTileId: number,
  merchantSpeed: number,
) => {
  const { mapSize, speed } = database.selectObject({
    sql: `
      SELECT
        map_size AS mapSize,
        speed
      FROM
        servers
      LIMIT 1;
    `,
    schema: z.strictObject({
      mapSize: z.number(),
      speed: speedSchema,
    }),
  })!;

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
  const village = getMarketplaceVillage(database, villageId)!;

  const merchant = merchantsMap.get(village.tribe)!;

  return {
    village,
    merchant,
    marketplaceLevel: getMarketplaceLevel(database, villageId),
    usedMerchantAmount: getUsedMerchantAmount(database, villageId),
  };
};
