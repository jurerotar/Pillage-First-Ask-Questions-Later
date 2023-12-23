import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapFilterName, MapFilters } from 'interfaces/models/game/map-filters';
import { database } from 'database/database';
import { Server } from 'interfaces/models/game/server';
import { useCurrentServer } from 'hooks/game/use-current-server';

export const mapFiltersCacheKey = 'map-filters';

export const getMapFilters = (serverId: Server['id']) => (database.mapFilters.where({ serverId })
  .first() as Promise<MapFilters>);

export const useMapFilters = () => {
  const queryClient = useQueryClient();
  const { serverId } = useCurrentServer();

  const {
    data
  } = useQuery<MapFilters>({
    queryKey: [mapFiltersCacheKey, serverId],
    queryFn: () => getMapFilters(serverId),
  });

  // Due to us working with only local data, which is prefetched in loader, we can do this assertion to save us from having to spam "!" everywhere
  const mapFilters = data as MapFilters;

  const { mutate: toggleMapFilter } = useMutation<void, Error, MapFilterName>({
    mutationFn: async (filterName) => {
      database.mapFilters.where({ serverId })
        .modify({
          [filterName]: !mapFilters![filterName]
        });
    },
    onMutate: (filterName) => {
      const updatedMapFilters = {
        ...mapFilters,
        [filterName]: !mapFilters[filterName]
      };

      queryClient.setQueryData<MapFilters>([mapFiltersCacheKey, serverId], updatedMapFilters);
    },
  });

  return {
    mapFilters,
    toggleMapFilter
  };
};
