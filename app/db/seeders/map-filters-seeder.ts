import type { Database } from 'app/interfaces/models/common';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

const sql = `INSERT INTO map_filters
  (
    filter_id,
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

  database.transaction((db) => {
    for (const mapFilter of mapFilters) {
      db.exec({
        sql,
        bind: [mapFilter, true],
      });
    }
  });
};
