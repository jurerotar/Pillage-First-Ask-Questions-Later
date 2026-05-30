import { use } from 'react';
import type { z } from 'zod';
import type { eventsHistoryItemDtoSchema } from '@pillage-first/types/dtos/history';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsHistoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export type HistoryEventType = z.infer<
  typeof eventsHistoryItemDtoSchema
>['type'];

type EventsHistoryPage = {
  items: z.infer<typeof eventsHistoryItemDtoSchema>[];
  nextCursor: string | null;
};

export const useEventsHistory = (
  scope: 'village' | 'global',
  types: HistoryEventType[] = [],
) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  return {
    queryKey: [eventsHistoryCacheKey, currentVillage.id, scope, types],
    queryFn: async ({
      cursor,
      pageSize,
    }: {
      cursor: string | null;
      pageSize: number;
    }): Promise<EventsHistoryPage> => {
      const { data } = await apiClient.get(
        '/villages/:villageId/history/events',
        {
          path: {
            villageId: currentVillage.id,
          },
          query: {
            scope,
            cursor,
            pageSize,
            ...(types.length > 0 ? { types } : {}),
          },
        },
      );

      return data;
    },
  };
};
