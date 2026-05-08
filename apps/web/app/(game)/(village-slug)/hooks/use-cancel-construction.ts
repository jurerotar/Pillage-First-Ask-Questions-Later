import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useCancelConstruction = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  return useMutation<void, Error, { eventId: GameEvent['id'] }>({
    mutationFn: async ({ eventId }) => {
      await apiClient.delete('/events/:eventId', {
        path: {
          eventId: `${eventId}`,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });
};
