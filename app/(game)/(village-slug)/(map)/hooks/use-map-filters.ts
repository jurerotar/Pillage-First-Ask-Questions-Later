import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import { mapFiltersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useMapFilters = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const { data: mapFilters } = useSuspenseQuery<MapFilters>({
    queryKey: [mapFiltersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<MapFilters>('/me/map-filters');
      return data;
    },
  });

  const { mutate: toggleMapFilter } = useMutation<MapFilters, Error, Partial<MapFilters>>({
    mutationFn: async (vars) => {
      const { data } = await fetcher<MapFilters>('/me/map-filters', {
        method: 'PATCH',
        body: {
          ...vars,
        },
      });

      return data;
    },
    onSuccess: (updatedMapFilters) => {
      queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], updatedMapFilters);
    },
  });

  return {
    mapFilters,
    toggleMapFilter,
    ...mapFilters,
  };
};
