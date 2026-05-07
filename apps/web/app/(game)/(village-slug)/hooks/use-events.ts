import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEvents = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: events } = useSuspenseQuery({
    queryKey: [eventsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/events', {
        path: {
          villageId: currentVillage.id,
        },
      });

      return data;
    },
  });

  return {
    events,
  };
};
