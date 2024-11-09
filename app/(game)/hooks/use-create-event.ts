import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import {
  type CreateBulkEventArgs,
  type CreateEventArgs,
  createEventFn,
  getCurrentVillageResources,
  insertBulkEvent,
  updateVillageResources,
} from 'app/(game)/hooks/utils/events';
import { eventFactory } from 'app/factories/event-factory';
import type { GameEvent, GameEventType } from 'app/interfaces/models/events/game-event';
import { eventsCacheKey } from 'app/query-keys';

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { currentVillageId } = useCurrentVillage();

  const { mutate: createEvent } = useMutation<void, Error, CreateEventArgs<T>>({
    mutationFn: async (args) => {
      // @ts-expect-error - TODO: Event definition is kinda garbage, but I've no clue how to fix it
      await createEventFn<T>(queryClient, {
        ...args,
        type: eventType,
        villageId: currentVillageId,
      });
    },
  });

  const { mutate: createBulkEvent } = useMutation<void, Error, CreateBulkEventArgs<T>>({
    mutationFn: async (args) => {
      const { amount, startsAt, duration, resourceCost, onFailure, onSuccess } = args;

      const { currentWood, currentClay, currentIron, currentWheat } = getCurrentVillageResources(queryClient, currentVillageId);

      const [woodCost, clayCost, ironCost, wheatCost] = resourceCost;
      if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
        onFailure?.(queryClient, args);
        return;
      }

      updateVillageResources(queryClient, currentVillageId, resourceCost, 'subtract');

      const events = [...Array(amount)].map((_, index) => {
        return eventFactory({
          ...args,
          type: eventType,
          villageId: currentVillageId,
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
