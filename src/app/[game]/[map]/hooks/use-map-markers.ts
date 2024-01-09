import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { database } from 'database/database';
import { Server } from 'interfaces/models/game/server';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { MapMarker } from 'interfaces/models/game/map-marker';
import { Tile } from 'interfaces/models/game/tile';
import { mapMarkerFactory } from 'app/[game]/factories/map-marker-factory';

export const mapMarkersCacheKey = 'map-markers';

export const getMapMarkers = (serverId: Server['id']) => database.mapMarkers.where({ serverId }).toArray();

export const useMapMarkers = () => {
  const queryClient = useQueryClient();
  const { serverId } = useCurrentServer();

  const { data: mapMarkers } = useQuery<MapMarker[]>({
    queryKey: [mapMarkersCacheKey, serverId],
    queryFn: () => getMapMarkers(serverId),
    initialData: [],
  });

  const { mutate: createMapMarker } = useMutation<void, Error, { tileId: Tile['tileId'] }>({
    mutationFn: async ({ tileId }) => {
      const mapMarker = mapMarkerFactory({ tileId, serverId });
      database.mapMarkers.add(mapMarker);
    },
    onMutate: ({ tileId }) => {
      const mapMarker = mapMarkerFactory({ tileId, serverId });
      const updatedMapMarkers = [mapMarker, ...mapMarkers];

      queryClient.setQueryData<MapMarker[]>([mapMarkersCacheKey, serverId], updatedMapMarkers);
    },
  });

  const { mutate: deleteMapMarker } = useMutation<void, Error, { tileId: Tile['tileId'] }>({
    mutationFn: async ({ tileId }) => {
      database.mapMarkers.where({ serverId, tileId }).delete();
    },
    onMutate: ({ tileId }) => {
      const updatedMapMarkers = mapMarkers.filter(({ tileId: id }) => id !== tileId);

      queryClient.setQueryData<MapMarker[]>([mapMarkersCacheKey, serverId], updatedMapMarkers);
    },
  });

  return {
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  };
};
