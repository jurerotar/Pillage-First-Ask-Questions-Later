import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventFactory } from 'app/factories/event-factory';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type CreateEventArgs<T extends GameEventType> = Omit<GameEvent<T>, 'id' | 'type' | 'villageId'> & {
  cachesToClearImmediately: string[];
};

type CreateBulkEventArgs<T extends GameEventType> = CreateEventArgs<T> & {
  amount: number;
};

type SendEventArgs<T extends GameEventType> = {
  events: GameEvent<T>[];
  cachesToClearImmediately: string[];
};

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
  const { fetcher } = use(ApiContext);

  const { mutate: sendEvent } = useMutation<void, Error, SendEventArgs<T>>({
    mutationFn: async ({ events }) => {
      await fetcher<void, { events: GameEvent[] }>('/events', {
        method: 'POST',
        body: {
          events,
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

  const createEvent = (args: CreateEventArgs<T>) => {
    // @ts-expect-error: My types suck, fix when you can
    const event = eventFactory<T>({
      ...args,
      type: eventType,
      villageId: currentVillage.id,
    });

    const { cachesToClearImmediately } = args;

    const events = [event];
    sendEvent({ events, cachesToClearImmediately });
  };

  const createBulkEvent = (args: CreateBulkEventArgs<T>) => {
    const events: GameEvent<T>[] = new Array(args.amount);

    const { amount, ...baseArgs } = args;
    const { startsAt, duration, cachesToClearImmediately } = baseArgs;

    for (let i = 0; i < args.amount!; i++) {
      events[i] =
        // @ts-expect-error: My types suck, fix when you can
        eventFactory({
          ...baseArgs,
          type: eventType,
          villageId: currentVillage.id,
          startsAt: startsAt + i * duration,
          duration,
        });
    }

    sendEvent({ events, cachesToClearImmediately });
  };

  return {
    createEvent,
    createBulkEvent,
  };
};
