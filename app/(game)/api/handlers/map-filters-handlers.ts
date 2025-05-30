import type { ApiHandler } from 'app/interfaces/api';
import { mapFiltersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';

export const getMapFilters: ApiHandler<MapFilters> = async (queryClient) => {
  const mapFilters = queryClient.getQueryData<MapFilters>([mapFiltersCacheKey])!;

  return mapFilters;
};

export const updateMapFilter: ApiHandler<MapFilters, '', Partial<MapFilters>> = async (queryClient, args) => {
  const { body } = args;
  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], (mapFilters) => {
    return {
      ...mapFilters!,
      ...body,
    };
  });

  const mapFilters = queryClient.getQueryData<MapFilters>([mapFiltersCacheKey])!;

  return mapFilters;
};
