import { mapFiltersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { ApiHandler } from 'app/interfaces/api';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

export const getMapFilters: ApiHandler<MapFilters> = async (queryClient) => {
  const mapFilters = queryClient.getQueryData<MapFilters>([
    mapFiltersCacheKey,
  ])!;

  return mapFilters;
};

type UpdateMapFilterBody = {
  value: boolean;
};

export const updateMapFilter: ApiHandler<
  void,
  'filterName',
  UpdateMapFilterBody
> = async (queryClient, { params, body }) => {
  const { filterName } = params;
  const { value } = body;

  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], (mapFilters) => {
    return {
      ...mapFilters!,
      [filterName]: value,
    };
  });
};
