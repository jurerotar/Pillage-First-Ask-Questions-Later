import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type {
  GameEvent,
  GameEventType,
  GameEventTypeToEventArgsMap,
} from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type CreateEventArgs<T extends GameEventType> = Omit<
  GameEventTypeToEventArgsMap<T>,
  'villageId' | 'type'
>;

type SendEventArgs<T extends GameEventType> = CreateEventArgs<T> & {
  cachesToClearImmediately: string[];
} & Pick<GameEvent, 'cachesToClearOnResolve'>;

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
  const { fetcher } = use(ApiContext);

  const { mutate: createEvent } = useMutation<void, Error, SendEventArgs<T>>({
    mutationFn: async (args) => {
      const { cachesToClearImmediately: _, ...eventBody } = args;

      await fetcher<void>('/events', {
        method: 'POST',
        body: {
          ...eventBody,
          villageId: currentVillage.id,
          type: eventType,
        },
      });
    },
    onSuccess: async (_, { cachesToClearImmediately }) => {
      for (const queryKey of cachesToClearImmediately) {
        await queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
    },
  });

  return {
    createEvent,
  };
};
