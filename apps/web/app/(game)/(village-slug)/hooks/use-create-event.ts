import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type {
  GameEventType,
  GameEventTypeToEventArgsMap,
} from '@pillage-first/types/models/game-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query.ts';

type CreateEventArgs<T extends GameEventType> = Omit<
  GameEventTypeToEventArgsMap<T>,
  'villageId' | 'type' | 'id' | 'startsAt' | 'duration' | 'resolvesAt'
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
      await invalidateQueries(context, [
        ...cachesToClearImmediately.map((queryKey) => [queryKey]),
        [eventsCacheKey],
      ]);
    },
  });

  return {
    createEvent,
  };
};
