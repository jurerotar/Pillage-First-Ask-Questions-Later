import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { eventFactory } from 'app/factories/event-factory';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();
  const { fetcher } = use(ApiContext);

  // If amount property is present, it's going to create multiple events
  const { mutate: createEvent } = useMutation<void, Error, Omit<GameEvent<T>, 'id' | 'type' | 'villageId' > & { amount?: number }>({
    mutationFn: async (args) => {
      // Pre-reserve array space. If amount property is present, we'll be creating {amount} of events, else just one
      const events: GameEvent<T>[] = new Array(args?.amount ?? 1);

      if (Object.hasOwn(args, 'amount')) {
        const { amount, ...baseArgs } = args;
        const { startsAt, duration } = baseArgs;

        for (let i = 0; i < args.amount!; i++) {
          events[i] = (
            // @ts-expect-error: This is actually correct, TS just can't correctly merge Omit<X, 'a' | 'b'> + { a: A, b: B }
            eventFactory({
              ...baseArgs,
              type: eventType,
              villageId: currentVillage.id,
              startsAt: startsAt + i * duration,
              duration,
            })
          );
        }
      } else {
        // @ts-expect-error: This is actually correct, TS just can't correctly merge Omit<X, 'a' | 'b'> + { a: A, b: B }
        const event = eventFactory<T>({
          ...args,
          type: eventType,
          villageId: currentVillage.id,
        });

        events[0] = event;
      }

      await fetcher<void, { events: GameEvent[] }>('/events', {
        method: 'POST',
        body: {
          events,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [eventsCacheKey] });
    }
  });

  return {
    createEvent,
  };
};
