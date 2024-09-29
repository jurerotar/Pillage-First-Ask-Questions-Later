import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { doesEventRequireResourceCheck } from 'app/[game]/hooks/guards/event-guards';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { eventsCacheKey, insertBulkEvent, insertEvent } from 'app/[game]/hooks/use-events';
import { getCurrentVillageResources, updateVillageResources } from 'app/[game]/hooks/utils/events';
import { eventFactory } from 'app/factories/event-factory';
import type { EventWithRequiredResourceCheck, GameEvent, GameEventType } from 'interfaces/models/events/game-event';

type CreateEventArgs<T extends GameEventType> = Omit<CreateEventFnArgs<T>, 'villageId' | 'type'>;

type CreateBulkEventArgs<T extends GameEventType> = CreateEventArgs<T> &
  EventWithRequiredResourceCheck & {
    amount: number;
  };

type CreateEventFnArgs<T extends GameEventType> = Omit<GameEvent<T>, 'id'> & {
  onSuccess?: (queryClient: QueryClient, args: CreateEventFnArgs<T> | CreateBulkEventArgs<T>) => void;
  onFailure?: (queryClient: QueryClient, args: CreateEventFnArgs<T> | CreateBulkEventArgs<T>) => void;
};

export const createEventFn = async <T extends GameEventType>(queryClient: QueryClient, args: CreateEventFnArgs<T>): Promise<void> => {
  const { villageId, onSuccess, onFailure } = args;
  const event: GameEvent<T> = eventFactory<T>(args);

  if (doesEventRequireResourceCheck(event)) {
    const { resourceCost } = event;

    const { currentWood, currentClay, currentIron, currentWheat } = getCurrentVillageResources(queryClient, villageId);

    const [woodCost, clayCost, ironCost, wheatCost] = resourceCost;
    if (woodCost > currentWood || clayCost > currentClay || ironCost > currentIron || wheatCost > currentWheat) {
      onFailure?.(queryClient, args);
      return;
    }

    updateVillageResources(queryClient, villageId, resourceCost, 'subtract');
  }

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (previousEvents) => insertEvent(previousEvents!, event));
  onSuccess?.(queryClient, args);
};

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
