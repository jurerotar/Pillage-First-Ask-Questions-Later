import { z } from 'zod';
import { createEvents } from '../../utils/create-event';
import {
  getMarketplaceVillage,
  getMerchantAmount,
  getVillageMerchantStats,
} from '../../utils/marketplace';
import { createController } from '../controller';
import { transferResourcesBodySchema } from './schemas/marketplace-schemas';

export const transferResources = createController(
  '/villages/:villageId/transfer-resources',
  'post',
  {
    summary: 'Transfer resources between player villages',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    requestBody: transferResourcesBodySchema,
  },
)(({ database, path: { villageId }, body: { targetVillageId, resources } }) => {
  database.transaction((db) => {
    const { village, merchant } = getVillageMerchantStats(db, villageId);

    const targetVillage = getMarketplaceVillage(db, targetVillageId);

    if (!targetVillage) {
      throw new Error('Target village does not exist');
    }

    const merchantAmount = getMerchantAmount(
      resources,
      merchant.merchantCapacity,
    );

    createEvents<'resourceTransfer'>(db, {
      type: 'resourceTransfer',
      villageId,
      targetVillageId,
      originTileId: village.tileId,
      targetTileId: targetVillage.tileId,
      resources,
      merchantAmount,
    });
  });
});
