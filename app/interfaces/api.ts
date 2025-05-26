import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import {
  eventConstructionCompletedKey,
  eventConstructionNotStartedKey,
  eventConstructionStartedKey, eventResolvedKey,
  type eventWorkerReadyKey
} from 'app/(game)/keys/event-keys';

type ApiHandlerArgs<TBody, TParams> = {
  body: TBody;
  params: TParams;
};

export type ApiHandler<TReturn, TParams = Record<string, string>, TBody = Record<string, unknown>> = (
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

export type EventResolvedApiNotificationEvent = ApiNotificationEvent & {
  cachesToClear: Pick<GameEvent, 'cachesToClear'>;
};

