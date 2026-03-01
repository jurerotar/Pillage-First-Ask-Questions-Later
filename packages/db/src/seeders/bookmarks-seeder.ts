import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const bookmarksSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        bookmarks (village_id, building_id, tab_name)
      SELECT
        v.id,
        b.id,
        'default'
      FROM
        villages v,
        building_ids b
      WHERE
        v.player_id = $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
  });
};
