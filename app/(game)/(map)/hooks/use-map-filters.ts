import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MapFilterName, MapFilters } from 'app/interfaces/models/game/map-filters';
import { mapFiltersCacheKey } from 'app/query-keys';

export const useMapFilters = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery<MapFilters>({
    queryKey: [mapFiltersCacheKey],
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const mapFilters = data as MapFilters;

  const { mutate: toggleMapFilter } = useMutation<void, Error, MapFilterName>({
    mutationFn: async (filterName) => {
      const updatedMapFilters = {
        ...mapFilters,
        [filterName]: !mapFilters[filterName],
      };

      queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], updatedMapFilters);
    },
  });

  return {
    mapFilters,
    toggleMapFilter,
    ...mapFilters,
  };
};
