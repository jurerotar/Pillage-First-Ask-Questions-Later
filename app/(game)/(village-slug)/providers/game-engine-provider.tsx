import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import useEventResolver from 'app/(game)/(village-slug)/providers/hooks/use-event-resolvers';
import type React from 'react';

export const GameEngineProvider: React.FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  useEventResolver(events, resolveEvent);

  return children;
};
