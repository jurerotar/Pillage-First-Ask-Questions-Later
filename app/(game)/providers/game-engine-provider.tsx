import { useEvents } from 'app/(game)/hooks/use-events';
import useEventResolver from 'app/(game)/providers/hooks/use-event-resolvers';
import type React from 'react';

export const GameEngineProvider: React.FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  useEventResolver(events, resolveEvent);

  return children;
};
