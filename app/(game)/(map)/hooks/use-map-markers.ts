import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mapMarkerFactory } from 'app/factories/map-marker-factory';
import type { MapMarker } from 'app/interfaces/models/game/map-marker';
import type { Tile } from 'app/interfaces/models/game/tile';
import { mapMarkersCacheKey } from 'app/query-keys';

export const useMapMarkers = () => {
  const queryClient = useQueryClient();

  const { data: mapMarkers } = useQuery<MapMarker[]>({
    queryKey: [mapMarkersCacheKey],
    initialData: [],
  });

  const { mutate: createMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
    mutationFn: async ({ tileId }) => {
      const mapMarker = mapMarkerFactory({ tileId });
      const updatedMapMarkers = [...mapMarkers, mapMarker];
      queryClient.setQueryData<MapMarker[]>([], updatedMapMarkers);
    },
  });

  const { mutate: deleteMapMarker } = useMutation<void, Error, { tileId: Tile['id'] }>({
    mutationFn: async ({ tileId }) => {
      const updatedMapMarkers = mapMarkers.filter(({ tileId: id }) => id !== tileId);
      queryClient.setQueryData<MapMarker[]>([], updatedMapMarkers);
    },
  });

  return {
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  };
};
