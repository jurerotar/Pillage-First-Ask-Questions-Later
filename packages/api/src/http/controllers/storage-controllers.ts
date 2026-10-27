import { z } from 'zod';
import { villageStorageDtoSchema } from '@pillage-first/types/dtos/village';
import {
  type Resources,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import { selectVillageStorageDeliveriesQuery } from '../../queries/storage-queries';
import {
  getStorageBoundaryTime,
  getStorageDeliveries,
  type StorageDeliveryEvent,
} from '../../utils/storage-projection';
import {
  calculateResourceSiteResourcesAt,
  getVillageTileId,
} from '../../utils/village';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../utils/zod/event-schemas';
import { createController } from '../controller';

export const getVillageStorage = createController(
  '/villages/:villageId/storage',
  {
    summary: 'Get village storage and incoming resource forecasts',
    requestParams: { path: z.strictObject({ villageId: z.coerce.number() }) },
    response: villageStorageDtoSchema,
  },
)(({ database, path: { villageId } }) => {
  const calculatedAt = Date.now();
  const tileId = getVillageTileId(database, villageId);
  const site = calculateResourceSiteResourcesAt(database, tileId, calculatedAt);

  const rows = database.selectObjects({
    sql: selectVillageStorageDeliveriesQuery,
    bind: { $village_id: villageId, $tile_id: tileId, $now: calculatedAt },
    schema: baseEventRowSchema,
  });

  const deliveries = getStorageDeliveries(
    rows.map(mapEventRowToTypedEvent) as StorageDeliveryEvent[],
  );

  const storedAmounts: Resources = {
    wood: site.currentWood,
    clay: site.currentClay,
    iron: site.currentIron,
    wheat: site.currentWheat,
  };

  const effectiveUpdates: Resources = {
    wood: site.lastEffectiveWoodUpdate,
    clay: site.lastEffectiveClayUpdate,
    iron: site.lastEffectiveIronUpdate,
    wheat: site.lastEffectiveWheatUpdate,
  };

  return {
    calculatedAt,
    resources: resourceSchema.options.map((resource) => {
      const stored = storedAmounts[resource];
      const lastEffectiveUpdate = effectiveUpdates[resource];
      const capacity =
        resource === 'wheat' ? site.granaryCapacity : site.warehouseCapacity;
      const hourlyProduction = site.hourlyProduction[resource];
      const incoming = { gathering: 0, marketplace: 0, troops: 0 };

      for (const delivery of deliveries) {
        incoming[delivery.source] += delivery.resources[resource];
      }

      const boundary = getStorageBoundaryTime(
        resource,
        stored,
        capacity,
        hourlyProduction,
        deliveries,
        lastEffectiveUpdate,
      );

      return {
        resource,
        incoming,
        fullAt: hourlyProduction >= 0 ? boundary : null,
        emptyAt: hourlyProduction < 0 ? boundary : null,
      };
    }),
  };
});
