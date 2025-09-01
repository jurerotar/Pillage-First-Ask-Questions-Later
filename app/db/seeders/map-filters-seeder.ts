import type { Seeder } from 'app/interfaces/db';

export const mapFiltersSeeder: Seeder = (database): void => {
  const stmt = database.prepare(`
    INSERT INTO map_filters (
      should_show_faction_reputation,
      should_show_oasis_icons,
      should_show_troop_movements,
      should_show_wheat_fields,
      should_show_tile_tooltips,
      should_show_treasure_icons
    ) VALUES (
      $should_show_faction_reputation,
      $should_show_oasis_icons,
      $should_show_troop_movements,
      $should_show_wheat_fields,
      $should_show_tile_tooltips,
      $should_show_treasure_icons
    )
  `);

  stmt
    .bind({
      $should_show_faction_reputation: 1,
      $should_show_oasis_icons: 1,
      $should_show_troop_movements: 1,
      $should_show_wheat_fields: 1,
      $should_show_tile_tooltips: 1,
      $should_show_treasure_icons: 1,
    })
    .stepReset();

  stmt.finalize();
};
