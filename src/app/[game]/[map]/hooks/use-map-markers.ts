import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { mapMarkerFactory } from 'app/factories/map-marker-factory';
import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Tile } from 'interfaces/models/game/tile';
import { getParsedFileContents } from 'app/utils/opfs';
import { useGameEngine } from 'app/[game]/providers/game-engine-provider';

export const mapMarkersCacheKey = 'map-markers';

export const useMapMarkers = () => {
  const queryClient = useQueryClient();
  const { serverHandle } = useCurrentServer();
  const { syncWorker } = useGameEngine();

  const { data: mapMarkers } = useQuery<MapMarker[]>({
    queryKey: [mapMarkersCacheKey],
    queryFn: () => getParsedFileContents(serverHandle, 'mapMarkers'),
    initialData: [],
  });

  const { mutate: createMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
    mutationFn: async ({ tileId }) => {
      const mapMarker = mapMarkerFactory({ tileId });
      const updatedMapMarkers = [...mapMarkers, mapMarker];
      queryClient.setQueryData<MapMarker[]>([], updatedMapMarkers);
      syncWorker.postMessage({ type: 'individual-sync', name: 'mapMarkers', data: updatedMapMarkers });
    },
  });

  const { mutate: deleteMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
    mutationFn: async ({ tileId }) => {
      const updatedMapMarkers = mapMarkers.filter(({ tileId: id }) => id !== tileId);
      queryClient.setQueryData<MapMarker[]>([], updatedMapMarkers);
      syncWorker.postMessage({ type: 'individual-sync', name: 'mapMarkers', data: updatedMapMarkers });
    },
  });

  return {
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  };
};
