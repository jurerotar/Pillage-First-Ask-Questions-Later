import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { reportListingFilterSchema } from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const reportFiltersSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO report_filters (player_id, filter, is_active)
      SELECT $player_id, value, 1
      FROM JSON_EACH($filters);
    `,
    bind: {
      $player_id: PLAYER_ID,
      $filters: JSON.stringify(reportListingFilterSchema.options),
    },
  });
};
