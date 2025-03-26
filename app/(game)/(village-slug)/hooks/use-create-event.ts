import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  type CreateBulkEventArgs,
  type CreateEventArgs,
  createEventFn,
  getCurrentVillageResources,
  insertBulkEvent,
  updateVillageResources,
} from 'app/(game)/(village-slug)/hooks/utils/events';
import { eventFactory } from 'app/factories/event-factory';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { doesEventRequireResourceUpdate } from 'app/(game)/(village-slug)/hooks/guards/event-guards';

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();

  const { mutate: createEvent } = useMutation<void, Error, CreateEventArgs<T>>({
    mutationFn: async (args) => {
      // @ts-expect-error - This is a dumb TypeScript issue, not sure how to fix it. Essentially we want CreateEventArgs to not
      // need type and villageId, since they are injected at hook level. But TypeScript cries about this.
      await createEventFn<T>(queryClient, {
        ...args,
        type: eventType,
        villageId: currentVillage.id,
      });
    },
  });

  const { mutate: createBulkEvent } = useMutation<void, Error, CreateBulkEventArgs<T>>({
    mutationFn: async (args) => {
      const { amount, startsAt, duration, onFailure, onSuccess } = args;

      if (doesEventRequireResourceUpdate(args, eventType)) {
        const { resourceCost } = args;
        const { currentWood, currentClay, currentIron, currentWheat } = getCurrentVillageResources(queryClient, currentVillage.id);

        const [woodCost, clayCost, ironCost, wheatCost] = resourceCost;
        if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
          onFailure?.(queryClient, args);
          return;
        }

        updateVillageResources(queryClient, currentVillage.id, resourceCost, 'subtract');
      }

      const events = [...Array(amount)].map((_, index) => {
        return eventFactory({
          ...args,
          type: eventType,
          villageId: currentVillage.id,
          startsAt: startsAt + index * duration,
          duration,
        });
      });

      queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (previousEvents) => {
        return insertBulkEvent(previousEvents!, events);
      });
      onSuccess?.(queryClient, args);
    },
  });

  return {
    createEvent,
    createBulkEvent,
  };
};
