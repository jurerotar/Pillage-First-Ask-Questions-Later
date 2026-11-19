import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { selectVillageIdAndTileIdQuery } from '../../../queries/village-queries';
import { moveTroopWheatConsumption } from '../../../utils/reinforcements';
import { insertMovementReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { defineEventResolver, type Resolver } from '../resolver';
import { movementCreation } from './troop-movement-event-helpers';

const resolveReinforcementMovement: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { originTileId, targetTileId, troops, resolvesAt, villageId } = args;

  const { tileType: targetTileType, villageId: targetVillageId } =
    database.selectObject({
      sql: selectVillageIdAndTileIdQuery,
      bind: { $tile_id: targetTileId },
      schema: z.strictObject({
        tileId: tileIdSchema,
        tileType: z.enum(['free', 'oasis']),
        villageId: z.number(),
      }),
    })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'reinforcement',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (targetTileType !== 'oasis') {
    moveTroopWheatConsumption(
      database,
      troops,
      originTileId,
      targetTileId,
      resolvesAt,
    );
  }

  return {
    affectedVillageIds: [
      villageId,
      targetTileType === 'oasis' ? null : targetVillageId,
    ],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const reinforcementMovementResolver =
  defineEventResolver<'troopMovementReinforcements'>(
    movementCreation,
    resolveReinforcementMovement,
  );
