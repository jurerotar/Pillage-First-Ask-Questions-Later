import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  reportFilterNameByScope,
  reportListingFilterSchema,
  reportScopeSchema,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const filtersSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO filters (player_id, name, filter)
      SELECT $player_id, filter_group.value, filter.value
      FROM JSON_EACH($filter_groups) AS filter_group
      CROSS JOIN JSON_EACH($filters) AS filter;
    `,
    bind: {
      $player_id: PLAYER_ID,
      $filter_groups: JSON.stringify(
        reportScopeSchema.options.map(
          (scope) => reportFilterNameByScope[scope],
        ),
      ),
      $filters: JSON.stringify(reportListingFilterSchema.options),
    },
  });
};
