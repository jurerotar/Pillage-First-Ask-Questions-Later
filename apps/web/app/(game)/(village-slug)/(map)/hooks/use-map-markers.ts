import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { MapMarker } from '@pillage-first/types/models/map-marker';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { mapMarkersCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useMapMarkers = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: mapMarkers } = useSuspenseQuery<MapMarker[]>({
    queryKey: [mapMarkersCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/map-markers', {
        path: {
          playerId: player.id,
        },
      });

      return data;
    },
  });

  const { mutate: createMapMarker } = useMutation<
    void,
    Error,
    { tileId: number }
  >({
    mutationFn: async ({ tileId }) => {
      await apiClient.post('/players/:playerId/map-markers', {
        path: {
          playerId: player.id,
        },
        body: { tileId },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[mapMarkersCacheKey]]);
    },
  });

  const { mutate: deleteMapMarker } = useMutation<
    void,
    Error,
    { tileId: number }
  >({
    mutationFn: async ({ tileId }) => {
      await apiClient.delete('/players/:playerId/map-markers/:tileId', {
        path: {
          playerId: player.id,
          tileId,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[mapMarkersCacheKey]]);
    },
  });

  return {
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  };
};
