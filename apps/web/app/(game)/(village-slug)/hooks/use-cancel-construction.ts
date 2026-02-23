import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  eventsCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCancelConstruction = () => {
  const { fetcher } = use(ApiContext);

  return useMutation<void, Error, { eventId: GameEvent['id'] }>({
    mutationFn: async ({ eventId }) => {
      await fetcher(`/events/${eventId}`, { method: 'DELETE' });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: [eventsCacheKey] });
      await context.client.invalidateQueries({
        queryKey: [playerVillagesCacheKey],
      });
    },
  });
};
