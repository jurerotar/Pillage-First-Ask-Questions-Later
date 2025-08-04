import type { ApiHandler } from 'app/interfaces/api';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

export const getMapFilters: ApiHandler<MapFilters> = async (
  _queryClient,
  database,
) => {
  return Object.fromEntries(
    database.selectArrays('SELECT filter_id, value FROM map_filters'),
  );
};

type UpdateMapFilterBody = {
  value: boolean;
};

export const updateMapFilter: ApiHandler<
  void,
  'filterName',
  UpdateMapFilterBody
> = async (_queryClient, database, { params, body }) => {
  const { filterName } = params;
  const { value } = body;

  database.exec({
    sql: 'UPDATE map_filters SET value = ? WHERE filter_id = ?;',
    bind: [value, filterName],
  });
};
