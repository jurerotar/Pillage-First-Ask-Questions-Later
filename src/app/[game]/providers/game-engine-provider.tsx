import { useEvents } from 'app/[game]/hooks/use-events';
import useEventResolver from 'app/[game]/providers/hooks/use-event-resolvers';
import type { FCWithChildren } from 'react';

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  useEventResolver(events, resolveEvent);

  return children;
};
