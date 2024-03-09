import { database } from 'database/database';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';
import { eventFactory } from 'app/[game]/factories/event-factory';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
} from 'app/[game]/resolvers/building-resolvers';

export const eventsCacheKey = 'events';

export const getEvents = (serverId: Server['id']) => database.events.where({ serverId }).toArray();

// To prevent constant resorting, events must be added to correct indexes, determined by their timestamp.
export const insertEvent = (previousEvents: GameEvent[], event: GameEvent): GameEvent[] => {
  const events: GameEvent[] = [...previousEvents];

  // Find the correct position to insert the new element
  let indexToInsert = 0;
  while (indexToInsert < events.length && event.resolvesAt > events[indexToInsert].resolvesAt) {
    indexToInsert += 1;
  }

  events.splice(indexToInsert, 0, event);

  return events;
}

const gameEventTypeToResolverFunctionMapper = (gameEventType: GameEventType) => {
  // eslint-disable-next-line default-case
  switch (gameEventType) {
    case GameEventType.BUILDING_LEVEL_CHANGE: {
      return buildingLevelChangeResolver;
    }
    case GameEventType.BUILDING_CONSTRUCTION: {
      return buildingConstructionResolver;
    }
    case GameEventType.BUILDING_DESTRUCTION: {
      return buildingDestructionResolver;
    }
  }
}

export const useEvents = () => {
  const queryClient = useQueryClient();
  const { serverId } = useCurrentServer();

  const {
    data: events,
    isLoading: isLoadingEvents,
    isSuccess: hasLoadedEvents,
    status: eventsQueryStatus,
  } = useQuery<GameEvent[]>({
    queryFn: () => getEvents(serverId),
    queryKey: [eventsCacheKey, serverId],
    initialData: [],
  });

  const { mutate: resolveEvent } = useMutation<void, Error, GameEvent['id']>({
    mutationFn: async (id) => {
      const event = events!.find(({ id: eventIdToFind }) => eventIdToFind === id)!;
      const resolver = gameEventTypeToResolverFunctionMapper(event.type);
      // @ts-expect-error - TODO: Fix this type
      resolver(event, queryClient);
      database.events.where({ serverId, id }).delete();
      queryClient.invalidateQueries({ queryKey: [eventsCacheKey, serverId] });
      console.log('resolved ', id, event);
    },
  });

  return {
    events,
    isLoadingEvents,
    hasLoadedEvents,
    eventsQueryStatus,
    resolveEvent,
  };
};

type CreateEventArgs<T extends GameEventType> = Omit<GameEvent<T>, 'serverId' | 'id' | 'type'>;

export const useCreateEvent = <T extends GameEventType>(eventType: T) => {
  const queryClient = useQueryClient();
  const { serverId } = useCurrentServer();
  const { events } = useEvents();

  const { mutate: createEvent } = useMutation<void, Error, CreateEventArgs<T>>({
    mutationFn: async (args: CreateEventArgs<T>): Promise<void> => {
      const event = eventFactory({ serverId, type: eventType, ...args });
      const newEvents = insertEvent(events, event);
      database.events.bulkPut(newEvents);
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey, serverId], (previousEvents) => {
        return insertEvent(previousEvents!, event);
      });
      console.log('created ', event.id);
    },
  });

  return createEvent;
}
