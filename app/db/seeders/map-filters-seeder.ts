import type { Database } from 'app/interfaces/models/common';

const sql = `INSERT INTO map_filters (
  should_show_faction_reputation,
  should_show_oasis_icons,
  should_show_troop_movements,
  should_show_wheat_fields,
  should_show_tile_tooltips,
  should_show_treasure_icons
) VALUES (?, ?, ?, ?, ?, ?);`;

export const mapFiltersSeeder = (database: Database): void => {
  database.exec({
    sql,
    bind: [true, true, true, true, true, true],
  });
};
