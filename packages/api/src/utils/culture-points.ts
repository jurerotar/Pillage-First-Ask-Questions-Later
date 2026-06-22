import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { updatePlayerCulturePointsAtQuery } from '../queries/player-queries';

export const updatePlayerCulturePointsAt = (
  database: DbFacade,
  timestamp: number,
): void => {
  database.exec({
    sql: updatePlayerCulturePointsAtQuery,
    bind: {
      $player_id: PLAYER_ID,
      $timestamp: timestamp,
    },
  });
};
