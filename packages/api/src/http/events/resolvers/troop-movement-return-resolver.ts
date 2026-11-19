import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { selectPlayerVillageIdByTileIdQuery } from '../../../queries/village-queries';
import { calculateAdventureDuration } from '../../../utils/adventures';
import { addTroops } from '../../../utils/troops';
import { addResourceSiteResourcesAt } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';
import {
  getMovementDuration,
  getTravelDuration,
} from './troop-movement-event-helpers';

const resolveReturnMovement: Resolver<GameEvent<'troopMovementReturn'>> = (
  database,
  args,
) => {
  const { villageId, originTileId, targetTileId, troops, loot, resolvesAt } =
    args;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (loot?.some((amount) => amount > 0)) {
    addResourceSiteResourcesAt(database, targetTileId, resolvesAt, loot);
  }

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [villageId, ...targetVillageIds],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const returnMovementResolver =
  defineEventResolver<'troopMovementReturn'>(
    (database, event) => ({
      duration: () =>
        getMovementDuration(database, () =>
          event.originalMovementType === 'troopMovementAdventure'
            ? calculateAdventureDuration(database, true)
            : getTravelDuration(database, event),
        ),
    }),
    resolveReturnMovement,
  );
