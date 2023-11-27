import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { GameEvent } from 'interfaces/models/events/game-event';
import { useCallback } from 'react';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';
import { Server } from 'interfaces/models/game/server';

export const eventsCacheKey = 'events';

export const getEvents = (serverId: Server['id']) => database.events.where({ serverId }).toArray();

export const useEvents = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateEvents } = useDatabaseMutation({ cacheKey: eventsCacheKey });

  const {
    data: events,
    isLoading: isLoadingEvents,
    isSuccess: hasLoadedEvents,
    status: eventsQueryStatus
  } = useAsyncLiveQuery<GameEvent[]>({
    queryFn: () => getEvents(serverId),
    deps: [serverId],
    fallback: [],
    cacheKey: eventsCacheKey,
    enabled: hasLoadedServer
  });

  const createEvent = useCallback(() => {

  }, []);

  return {
    events,
    isLoadingEvents,
    hasLoadedEvents,
    eventsQueryStatus,
  };
};
