import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useCancelUnitImprovement = () => {
  const { fetcher } = use(ApiContext);

  return useMutation<void, Error, { eventId: GameEvent['id'] }>({
    mutationFn: async ({ eventId }) => {
      await fetcher(`/events/unit-improvement-event/${eventId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [eventsCacheKey],
        [currentVillageCacheKey],
      ]);
    },
  });
};
