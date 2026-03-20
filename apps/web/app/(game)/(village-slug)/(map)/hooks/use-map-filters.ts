import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { MapFilters } from '@pillage-first/types/models/map-filters';
import { mapFiltersCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query.ts';

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
      await invalidateQueries(context, [[mapFiltersCacheKey]]);
    },
  });

  return {
    mapFilters,
    toggleMapFilter,
    ...mapFilters,
  };
};
