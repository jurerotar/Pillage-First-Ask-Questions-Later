import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createEvents } from '../../../utils/create-event';
import {
  getMerchantAmount,
  getTotalResourceAmount,
  getVillageMerchantStats,
} from '../../../utils/marketplace';
import { insertTradeReport } from '../../../utils/report';
import { addResourceSiteResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

export const resourceTransferResolver: Resolver<
  GameEvent<'resourceTransfer'>
> = (database, event) => {
  const {
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources,
    merchantAmount,
    resolvesAt,
  } = event;

  if (getTotalResourceAmount(resources) === 0) {
    return {
      affectedVillageIds: [villageId],
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
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
  };
};

export const tradeRouteResolver: Resolver<GameEvent<'tradeRoute'>> = (
  database,
  event,
) => {
  const {
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources,
    resolvesAt,
    interval,
  } = event;

  try {
    const { merchant } = getVillageMerchantStats(database, villageId);
    const merchantAmount = getMerchantAmount(
      resources,
      merchant.merchantCapacity,
    );

    createEvents<'resourceTransfer'>(database, {
      type: 'resourceTransfer',
      villageId,
      targetVillageId,
      originTileId,
      targetTileId,
      resources,
      merchantAmount,
      startsAt: resolvesAt,
    });
  } catch {
    // A route miss is expected when resources or free merchants are unavailable.
  }

  createEvents<'tradeRoute'>(database, {
    type: 'tradeRoute',
    villageId,
    targetVillageId,
    originTileId,
    targetTileId,
    resources,
    interval,
    startsAt: resolvesAt + interval,
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
  };
};
