import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createEvents } from '../../../utils/create-event';
import { getTotalResourceAmount } from '../../../utils/marketplace';
import { insertReport } from '../../../utils/report';
import { addVillageResourcesAt } from '../../../utils/village';
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

  addVillageResourcesAt(database, targetVillageId, resolvesAt, [
    resources.wood,
    resources.clay,
    resources.iron,
    resources.wheat,
  ]);

  const isPlayerVillage = database.selectValue({
    sql: `
      SELECT EXISTS(
        SELECT 1 FROM villages
        WHERE id = $village_id AND player_id = $player_id
      );
    `,
    bind: {
      $village_id: targetVillageId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  });

  if (isPlayerVillage) {
    const reportId = insertReport(database, {
      playerId: PLAYER_ID,
      villageId: targetVillageId,
      timestamp: resolvesAt,
      type: 'trade',
      outcome: 'incomingMerchantsArrived',
      tags: [],
    });

    database.exec({
      sql: `
        INSERT INTO trade_reports (
          report_id,
          origin_tile_id,
          target_tile_id,
          wood,
          clay,
          iron,
          wheat
        ) VALUES (
          $report_id,
          $origin_tile_id,
          $target_tile_id,
          $wood,
          $clay,
          $iron,
          $wheat
        );
      `,
      bind: {
        $report_id: reportId,
        $origin_tile_id: originTileId,
        $target_tile_id: targetTileId,
        $wood: resources.wood,
        $clay: resources.clay,
        $iron: resources.iron,
        $wheat: resources.wheat,
      },
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
    merchantAmount,
    resolvesAt,
    interval,
  } = event;

  try {
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
    merchantAmount,
    interval,
    startsAt: resolvesAt + interval,
  });

  return {
    affectedVillageIds: [villageId, targetVillageId],
  };
};
