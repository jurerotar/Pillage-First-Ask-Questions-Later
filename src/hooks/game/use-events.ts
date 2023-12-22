import { database } from 'database/database';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { GameEvent } from 'interfaces/models/events/game-event';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server } from 'interfaces/models/game/server';

export const eventsCacheKey = 'events';

export const getEvents = (serverId: Server['id']) => database.events.where({ serverId }).toArray();

export const useEvents = () => {
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

  const createEvent = useCallback(() => {

  }, []);

  return {
    events,
    isLoadingEvents,
    hasLoadedEvents,
    eventsQueryStatus,
    createEvent,
  };
};
