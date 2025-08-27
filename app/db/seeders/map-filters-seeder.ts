import type { Seeder } from 'app/interfaces/db';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

export const mapFiltersSeeder: Seeder = (database): void => {
  const mapFilters: (keyof MapFilters)[] = [
    'shouldShowFactionReputation',
    'shouldShowOasisIcons',
    'shouldShowTroopMovements',
    'shouldShowWheatFields',
    'shouldShowTileTooltips',
    'shouldShowTreasureIcons',
  ];

  const stmt = database.prepare(`
    INSERT INTO map_filters (
      filter_key,
      value
    ) VALUES ($filter_key, $value);
  `);

  for (const mapFilter of mapFilters) {
    stmt
      .bind({
        $filter_key: mapFilter,
        $value: true,
      })
      .stepReset();
  }

  stmt.finalize();
};
