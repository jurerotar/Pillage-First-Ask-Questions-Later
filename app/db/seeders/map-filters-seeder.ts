import type { Seeder } from 'app/interfaces/db';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

const sql = `INSERT INTO map_filters
  (
    filter_key,
    value
  )
VALUES (?, ?);`;

export const mapFiltersSeeder: Seeder = (database): void => {
  const mapFilters: (keyof MapFilters)[] = [
    'shouldShowFactionReputation',
    'shouldShowOasisIcons',
    'shouldShowTroopMovements',
    'shouldShowWheatFields',
    'shouldShowTileTooltips',
    'shouldShowTreasureIcons',
  ];

  const stmt = database.prepare(sql);

  for (const mapFilter of mapFilters) {
    stmt.bind([mapFilter, true]).stepReset();
  }

  stmt.finalize();
};
