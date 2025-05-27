import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type {
  eventConstructionCompletedKey,
  eventConstructionNotStartedKey,
  eventConstructionStartedKey,
  eventResolvedKey,
  eventWorkerReadyKey,
} from 'app/(game)/keys/event-keys';

type ApiHandlerArgs<TBody, TParams extends string> = {
  body: TBody;
  params: Record<TParams, string>;
};

export type ApiHandler<TReturn = void, TParams extends string = '', TBody = Record<string, unknown>> = (
  queryClient: QueryClient,
  args: ApiHandlerArgs<TBody, TParams>,
) => Promise<TReturn>;

type EventKey =
  | typeof eventWorkerReadyKey
  | typeof eventResolvedKey
  | typeof eventConstructionNotStartedKey
  | typeof eventConstructionStartedKey
  | typeof eventConstructionCompletedKey;

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type EventResolvedApiNotificationEvent = ApiNotificationEvent & Pick<GameEvent, 'cachesToClear'>;
