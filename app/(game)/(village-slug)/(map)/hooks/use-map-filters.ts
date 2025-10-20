import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import { mapFiltersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type UpdateMapFiltersArgs = {
  filterName: keyof MapFilters;
  value: boolean;
};

export const useMapFilters = () => {
  const { fetcher } = use(ApiContext);

  const { data: mapFilters } = useSuspenseQuery({
    queryKey: [mapFiltersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<MapFilters>('/me/map-filters');
      return data;
    },
  });

  const { mutate: toggleMapFilter } = useMutation<
    void,
    Error,
    UpdateMapFiltersArgs
  >({
    mutationFn: async ({ filterName, value }) => {
      await fetcher(`/me/map-filters/${filterName}`, {
        method: 'PATCH',
        body: {
          value,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [mapFiltersCacheKey],
      });
    },
  });

  return {
    mapFilters,
    toggleMapFilter,
    ...mapFilters,
  };
};
