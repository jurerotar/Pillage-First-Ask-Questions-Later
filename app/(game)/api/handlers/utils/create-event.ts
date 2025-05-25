import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent, GameEventType } from 'app/interfaces/models/game/game-event';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';
import { eventFactory } from 'app/factories/event-factory';

export const createEvent = <T extends GameEventType>(queryClient: QueryClient, args: Omit<GameEvent<T>, 'id'>) => {
  const event = eventFactory<T>(args);

  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (prevEvents) => {
    return insertBulkEvent(prevEvents!, [event]);
  });
};
