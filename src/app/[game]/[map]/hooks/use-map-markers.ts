import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { mapMarkerFactory } from 'app/factories/map-marker-factory';
import { database } from 'database/database';
import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';

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

  const { mutate: createMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
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

  const { mutate: deleteMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
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
