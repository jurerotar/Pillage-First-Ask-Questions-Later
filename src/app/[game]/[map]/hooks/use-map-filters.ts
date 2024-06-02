import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import type { MapFilterName, MapFilters } from 'interfaces/models/game/map-filters';
import { getParsedFileContents } from 'app/utils/opfs';
import { useGameEngine } from 'app/[game]/providers/game-engine-provider';

export const mapFiltersCacheKey = 'map-filters';

export const useMapFilters = () => {
  const queryClient = useQueryClient();
  const { serverHandle } = useCurrentServer();
  const { syncWorker } = useGameEngine();

  const { data } = useQuery<MapFilters>({
    queryKey: [mapFiltersCacheKey],
    queryFn: () => getParsedFileContents(serverHandle, 'mapFilters'),
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
      syncWorker.postMessage({ type: 'individual-sync', name: 'mapFilters', data: updatedMapFilters });
    },
  });

  return {
    mapFilters,
    toggleMapFilter,
    ...mapFilters,
  };
};
