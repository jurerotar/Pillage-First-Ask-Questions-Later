import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const mapFiltersSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO
        map_filters (player_id, should_show_faction_reputation, should_show_oasis_icons, should_show_troop_movements,
                     should_show_wheat_fields, should_show_tile_tooltips, should_show_treasure_icons)
      VALUES
        (${PLAYER_ID}, 1, 1, 1, 1, 1, 1)
    `,
  });
};
