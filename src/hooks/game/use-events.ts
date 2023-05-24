import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { GameEvent } from 'interfaces/models/events/game-event';
import { useCallback, useEffect, useState } from 'react';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';

export const useEvents = () => {
  const { serverId } = useCurrentServer();

  const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  const {
    data: events,
    isLoading: isLoadingEvents,
    isSuccess: hasLoadedEvents,
    status: eventsQueryStatus
  } = useAsyncLiveQuery<GameEvent[]>(async () => {
    return database.events.where({ serverId }).toArray();
  }, [serverId], []);

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
