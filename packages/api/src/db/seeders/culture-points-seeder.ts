import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const culturePointsSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  database.exec({
    sql: `
      INSERT INTO culture_points
        (player_id, culture_points, culture_points_updated_at)
      VALUES ($player_id, 0, $updated_at);
    `,
    bind: {
      $player_id: PLAYER_ID,
      $updated_at: server.createdAt,
    },
  });
};
