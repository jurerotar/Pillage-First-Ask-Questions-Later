import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { MapMarker } from '@pillage-first/types/models/map-marker';
import { mapMarkersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useMapMarkers = () => {
  const { data: mapMarkers } = useSuspenseQuery<MapMarker[]>({
    queryKey: [mapMarkersCacheKey],
  });

  const { mutate: createMapMarker } = useMutation<
    void,
    Error,
    { tileId: number }
  >({
    mutationFn: async ({ tileId: _tileId }) => {},
  });

  const { mutate: deleteMapMarker } = useMutation<
    void,
    Error,
    { tileId: number }
  >({
    mutationFn: async ({ tileId: _tileId }) => {},
  });

  return {
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  };
};
