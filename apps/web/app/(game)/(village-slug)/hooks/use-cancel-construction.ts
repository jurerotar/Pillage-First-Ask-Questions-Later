import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import {
  currentVillageCacheKey,
  eventsCacheKey,
  scheduledBuildingUpgradesCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useCancelConstruction = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  return useMutation<void, Error, { eventId: GameEvent['id'] }>({
    mutationFn: async ({ eventId }) => {
      await fetcher(`/events/${eventId}`, { method: 'DELETE' });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });
};
