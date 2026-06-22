import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createEvents } from '../../../utils/create-event';
import { getTotalResourceAmount } from '../../../utils/marketplace';
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
