import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  getMarketplaceVillage,
  getMarketplaceVillageByTileId,
  getMerchantAmount,
  getMerchantMovementDurationByVillageId,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from '../../../utils/marketplace';
import { insertTradeReport } from '../../../utils/report';
import { addResourceSiteResourcesAt } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveResourceTransfer: Resolver<GameEvent<'resourceTransfer'>> = (
  database,
  event,
  createEvents,
) => {
  const {
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources,
    merchantAmount,
    repeatRemaining,
    repeatResources,
    resolvesAt,
  } = event;

  if (getTotalResourceAmount(resources) === 0) {
    if (repeatRemaining > 0) {
      const nextTargetVillage = getMarketplaceVillageByTileId(
        database,
        originTileId,
      );

      if (nextTargetVillage) {
        try {
          const { merchant } = getVillageMerchantStats(database, villageId);
          const nextMerchantAmount = getMerchantAmount(
            repeatResources,
            merchant.merchantCapacity,
          );

          createEvents<'resourceTransfer'>(database, {
            type: 'resourceTransfer',
            villageId,
            targetVillageId: nextTargetVillage.id,
            originTileId: targetTileId,
            targetTileId: originTileId,
            resources: repeatResources,
            merchantAmount: nextMerchantAmount,
            startsAt: resolvesAt,
            repeatRemaining: repeatRemaining - 1,
            repeatResources,
          });

          return {
            affectedVillageIds: [villageId, nextTargetVillage.id],
            affectedTileIds: [originTileId, targetTileId],
          };
        } catch {
          // Repeated merchant transfers stop when the next leg cannot start.
        }
      }
    }

    return {
      affectedVillageIds: [villageId],
      affectedTileIds: [originTileId, targetTileId],
    };
  }

  addResourceSiteResourcesAt(database, targetTileId, resolvesAt, [
    resources.wood,
    resources.clay,
    resources.iron,
    resources.wheat,
  ]);

  const playerVillageIds = database.selectValues({
    sql: `
      SELECT id FROM villages
      WHERE id IN ($origin_village_id, $target_village_id)
        AND player_id = $player_id;
    `,
    bind: {
      $origin_village_id: villageId,
      $target_village_id: targetVillageId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  });

  const ownsOriginVillage = playerVillageIds.some((id) => id === villageId);

  const ownsTargetVillage = playerVillageIds.some(
    (id) => id === targetVillageId,
  );

  if (ownsOriginVillage && !ownsTargetVillage) {
    insertTradeReport(database, {
      villageId,
      timestamp: resolvesAt,
      outcome: 'outgoingMerchantsArrived',
      originTileId,
      targetTileId,
      resources,
    });
  }

  if (ownsTargetVillage) {
    insertTradeReport(database, {
      villageId: targetVillageId,
      timestamp: resolvesAt,
      outcome: 'incomingMerchantsArrived',
      originTileId,
      targetTileId,
      resources,
    });
  }

  createEvents<'resourceTransfer'>(database, {
    type: 'resourceTransfer',
    villageId,
    targetVillageId: villageId,
    originTileId: targetTileId,
    targetTileId: originTileId,
    resources: {
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    },
    merchantAmount,
    startsAt: resolvesAt,
    repeatRemaining,
    repeatResources,
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const resourceTransferResolver = defineEventResolver<'resourceTransfer'>(
  (database, event) => ({
    validate: () => {
      const totalResourceAmount = getTotalResourceAmount(event.resources);
      const isReturnTransfer = totalResourceAmount === 0;

      if (isReturnTransfer) {
        if (event.targetVillageId !== event.villageId) {
          throw new Error('Merchant return must target the source village');
        }

        const village = getMarketplaceVillage(database, event.villageId);

        if (!village) {
          throw new Error(
            'Target village does not exist or does not belong to player',
          );
        }

        if (event.targetTileId !== village.tileId) {
          throw new Error('Merchant return target tile must be source village');
        }

        return;
      }

      const { village, merchant, marketplaceLevel, usedMerchantAmount } =
        getVillageMerchantStats(database, event.villageId);

      const targetVillage = getMarketplaceVillage(
        database,
        event.targetVillageId,
      );

      if (!targetVillage || targetVillage.playerId !== village.playerId) {
        throw new Error(
          'Target village does not exist or does not belong to player',
        );
      }

      if (targetVillage.tileId !== event.targetTileId) {
        throw new Error('Target tile does not belong to target village');
      }

      if (event.targetVillageId === event.villageId) {
        throw new Error('Target village must be different from source village');
      }

      if (village.tileId !== event.originTileId) {
        throw new Error('Origin tile does not belong to source village');
      }

      const merchantAmount = getMerchantAmount(
        event.resources,
        merchant.merchantCapacity,
      );

      if (event.merchantAmount !== merchantAmount) {
        throw new Error('Invalid merchant amount');
      }

      if (merchantAmount > marketplaceLevel - usedMerchantAmount) {
        throw new Error('Not enough free merchants');
      }
    },
    cost: () => {
      const { wood, clay, iron, wheat } = event.resources;

      return [wood, clay, iron, wheat];
    },
    duration: () => {
      return getMerchantMovementDurationByVillageId(
        database,
        event.villageId,
        event.originTileId,
        event.targetTileId,
      );
    },
    chargeAt: (startsAt) => startsAt,
  }),
  resolveResourceTransfer,
);
