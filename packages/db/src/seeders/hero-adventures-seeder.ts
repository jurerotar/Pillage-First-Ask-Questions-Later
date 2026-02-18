import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const heroAdventuresSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        hero_adventures (hero_id, available, completed)
      SELECT id, 3, 0
      FROM
        heroes
      WHERE
        player_id = $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
