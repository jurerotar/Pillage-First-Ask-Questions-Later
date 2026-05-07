import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsHistoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const getEventsHistorySchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.string(),
    villageId: z.number(),
    type: z.literal('construction'),
    timestamp: z.number(),
    data: z.preprocess(
      (val) => (typeof val === 'string' ? JSON.parse(val) : val),
      z.strictObject({
        fieldId: z.number(),
        building: buildingIdSchema,
        previousLevel: z.number(),
        newLevel: z.number(),
      }),
    ),
  }),
  z.strictObject({
    id: z.string(),
    villageId: z.number(),
    type: z.literal('training'),
    timestamp: z.number(),
    data: z.preprocess(
      (val) => (typeof val === 'string' ? JSON.parse(val) : val),
      z.strictObject({
        batchId: z.string(),
        unit: unitIdSchema,
        building: buildingIdSchema,
        amount: z.number(),
      }),
    ),
  }),
  z.strictObject({
    id: z.string(),
    villageId: z.number(),
    type: z.literal('improvement'),
    timestamp: z.number(),
    data: z.preprocess(
      (val) => (typeof val === 'string' ? JSON.parse(val) : val),
      z.strictObject({
        unit: unitIdSchema,
        previousLevel: z.number(),
        newLevel: z.number(),
      }),
    ),
  }),
  z.strictObject({
    id: z.string(),
    villageId: z.number(),
    type: z.literal('research'),
    timestamp: z.number(),
    data: z.preprocess(
      (val) => (typeof val === 'string' ? JSON.parse(val) : val),
      z.strictObject({
        unit: unitIdSchema,
      }),
    ),
  }),
  z.strictObject({
    id: z.string(),
    villageId: z.number(),
    type: z.literal('founding'),
    timestamp: z.number(),
    data: z.preprocess(
      (val) => (typeof val === 'string' ? JSON.parse(val) : val),
      z.strictObject({
        tileId: z.number(),
        x: z.number(),
        y: z.number(),
      }),
    ),
  }),
]);

export type HistoryEvent = z.infer<typeof getEventsHistorySchema>;

export const useEventsHistory = (
  scope: 'village' | 'global',
  types: HistoryEvent['type'][] = [],
) => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: events } = useSuspenseQuery({
    queryKey: [eventsHistoryCacheKey, currentVillage.id, scope, types],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/history/events',
        {
          path: {
            villageId: currentVillage.id,
          },
          query: {
            scope,
            ...(types.length > 0 ? { types } : {}),
          },
        },
      );

      return z.array(getEventsHistorySchema).parse(data);
    },
  });

  return {
    events,
  };
};
