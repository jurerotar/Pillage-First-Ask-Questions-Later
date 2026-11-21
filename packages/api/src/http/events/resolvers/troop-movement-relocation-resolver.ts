import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { selectRelocationTargetVillageIdByTileIdQuery } from '../../../queries/troop-movement-queries';
import { relocateHero } from '../../../utils/hero';
import { moveTroopWheatConsumption } from '../../../utils/reinforcements';
import { insertMovementReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { defineEventResolver, type Resolver } from '../resolver';
import { movementCreation } from './troop-movement-event-helpers';

const resolveRelocationMovement: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const { originTileId, targetTileId, troops, resolvesAt, villageId } = args;

  const targetVillageId = database.selectValue({
    sql: selectRelocationTargetVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId },
    schema: z.number(),
  })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'relocation',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      sourceTileId: targetTileId,
    })),
  );

  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    relocateHero(database, villageId, targetVillageId, resolvesAt);
  }

  moveTroopWheatConsumption(
    database,
    troops,
    originTileId,
    targetTileId,
    resolvesAt,
  );

  return {
    affectedVillageIds: [villageId, targetVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const relocationMovementResolver =
  defineEventResolver<'troopMovementRelocation'>(
    movementCreation,
    resolveRelocationMovement,
  );
