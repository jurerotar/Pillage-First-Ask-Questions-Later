import type { GameEvent } from '@pillage-first/types/models/game-event';
import { occupyOasisForVillage } from '../../../utils/oasis';
import { defineEventResolver, type Resolver } from '../resolver';
import { movementCreation } from './troop-movement-event-helpers';

const resolveOasisOccupationMovement: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (database, args, createEvents) => {
  const { originTileId, targetTileId, resolvesAt, troops, villageId, type } =
    args;

  const { previousOwnerVillageId } = occupyOasisForVillage(
    database,
    villageId,
    targetTileId,
    resolvesAt,
  );

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    type: 'troopMovementReturn',
    originalMovementType: type,
    troops,
  });

  return {
    affectedVillageIds: [villageId, previousOwnerVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const oasisOccupationMovementResolver =
  defineEventResolver<'troopMovementOasisOccupation'>(
    movementCreation,
    resolveOasisOccupationMovement,
  );
