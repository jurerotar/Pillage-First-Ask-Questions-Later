import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const heroAdventuresSeeder = (database: DbFacade): void => {
  const serverCreatedAt = database.selectValue({
    sql: 'SELECT created_at FROM servers LIMIT 1;',
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      INSERT INTO
        hero_adventures (hero_id, available, last_updated_at, completed)
      SELECT id, 3, $last_updated_at, 0
      FROM
        heroes
      WHERE
        player_id = $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
      $last_updated_at: serverCreatedAt,
    },
  });
};
