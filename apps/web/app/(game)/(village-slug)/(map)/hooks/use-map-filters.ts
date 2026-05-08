import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { MapFilters } from '@pillage-first/types/models/map-filters';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { mapFiltersCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type UpdateMapFiltersArgs = {
  filterName: keyof MapFilters;
  value: boolean;
};

export const useMapFilters = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: mapFilters } = useSuspenseQuery({
    queryKey: [mapFiltersCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/map-filters', {
        path: {
          playerId: player.id,
        },
      });

      return data;
    },
  });

  const { mutate: toggleMapFilter } = useMutation<
    void,
    Error,
    UpdateMapFiltersArgs
  >({
    mutationFn: async ({ filterName, value }) => {
      await apiClient.patch('/players/:playerId/map-filters/:filterName', {
        path: {
          playerId: player.id,
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
