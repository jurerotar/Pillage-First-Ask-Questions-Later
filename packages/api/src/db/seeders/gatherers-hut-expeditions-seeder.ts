import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const gatherersHutExpeditionsSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        gatherers_hut_expeditions (village_id, completed)
      SELECT id, 0
      FROM
        villages
      WHERE
        player_id = $player_id
      ON CONFLICT(village_id) DO NOTHING;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
