import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { GameEvent } from 'interfaces/models/events/game-event';
import { useCallback, useEffect, useState } from 'react';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { useDatabaseMutation } from 'hooks/database/use-database-mutation';

const cacheKey = 'events';

export const useEvents = () => {
  const { serverId, hasLoadedServer } = useCurrentServer();
  const { mutate: mutateEvents } = useDatabaseMutation({ cacheKey });

  const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  const {
    data: events,
    isLoading: isLoadingEvents,
    isSuccess: hasLoadedEvents,
    status: eventsQueryStatus
  } = useAsyncLiveQuery<GameEvent[]>({
    queryFn: () => database.events.where({ serverId }).toArray(),
    deps: [serverId],
    fallback: [],
    cacheKey,
    enabled: hasLoadedServer
  });

  const createEvent = useCallback(() => {

  }, []);

  useEffect(() => {

  }, [isResolvingEvents]);

  return {
    events,
    isLoadingEvents,
    hasLoadedEvents,
    eventsQueryStatus,
    isResolvingEvents
  };
};
