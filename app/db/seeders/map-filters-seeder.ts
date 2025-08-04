import type { Database } from 'app/interfaces/models/common';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

const sql = `INSERT INTO map_filters
  (
    filter_key,
    value
  )
VALUES (?, ?);`;

export const mapFiltersSeeder = (database: Database): void => {
  const mapFilters: (keyof MapFilters)[] = [
    'shouldShowFactionReputation',
    'shouldShowOasisIcons',
    'shouldShowTroopMovements',
    'shouldShowWheatFields',
    'shouldShowTileTooltips',
    'shouldShowTreasureIcons',
  ];

  for (const mapFilter of mapFilters) {
    database.exec({
      sql,
      bind: [mapFilter, true],
    });
  }
};
