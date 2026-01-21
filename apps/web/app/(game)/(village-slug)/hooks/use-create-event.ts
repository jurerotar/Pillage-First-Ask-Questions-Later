import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type {
  GameEventType,
  GameEventTypeToEventArgsMap,
} from '@pillage-first/types/models/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

type CreateEventArgs<T extends GameEventType> = Omit<
  GameEventTypeToEventArgsMap<T>,
  'villageId' | 'type'
>;

type SendEventArgs<T extends GameEventType> = CreateEventArgs<T> & {
  cachesToClearImmediately: string[];
};

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const { currentVillage } = useCurrentVillage();
  const { fetcher } = use(ApiContext);

  const { mutate: createEvent } = useMutation<void, Error, SendEventArgs<T>>({
    mutationFn: async (args) => {
      const { cachesToClearImmediately: _, ...eventBody } = args;

      await fetcher('/events', {
        method: 'POST',
        body: {
          ...eventBody,
          villageId: currentVillage.id,
          type: eventType,
        },
      });
    },
    onSuccess: async (
      _,
      { cachesToClearImmediately },
      _onMutateResult,
      context,
    ) => {
      await Promise.all(
        cachesToClearImmediately.map((queryKey) => {
          return context.client.invalidateQueries({ queryKey: [queryKey] });
        }),
      );

      await context.client.invalidateQueries({ queryKey: [eventsCacheKey] });
    },
  });

  return {
    createEvent,
  };
};
