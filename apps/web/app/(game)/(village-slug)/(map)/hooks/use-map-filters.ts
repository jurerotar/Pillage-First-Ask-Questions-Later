import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { MapFilters } from '@pillage-first/types/models/map-filters';
import { mapFiltersCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

type UpdateMapFiltersArgs = {
  filterName: keyof MapFilters;
  value: boolean;
};

export const useMapFilters = () => {
  const { apiClient } = use(ApiContext);

  const { data: mapFilters } = useSuspenseQuery({
    queryKey: [mapFiltersCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/map-filters');

      return data;
    },
  });

  const { mutate: toggleMapFilter } = useMutation<
    void,
    Error,
    UpdateMapFiltersArgs
  >({
    mutationFn: async ({ filterName, value }) => {
      await apiClient.patch('/me/map-filters/:filterName', {
        path: {
          filterName,
        },
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
