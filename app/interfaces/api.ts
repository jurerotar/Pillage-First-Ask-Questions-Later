import type { QueryClient } from '@tanstack/react-query';
import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';

type ApiHandlerArgs<TBody, TParams extends string> = {
  body: TBody;
  params: Record<TParams, string>;
};

export type ApiHandler<
  TReturn = void,
  TParams extends string = '',
  TBody = Record<string, unknown>,
> = (
  queryClient: QueryClient,
  args: ApiHandlerArgs<TBody, TParams>,
) => Promise<TReturn>;

type EventKey =
  | 'event:worker-initialization-success'
  | 'event:worker-initialization-error'
  | 'event:worker-event-creation-success'
  | 'event:worker-event-creation-error'
  | 'event:worker-event-resolve-success'
  | 'event:worker-event-resolve-error';

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type WorkerInitializationErrorEvent = {
  eventKey: EventKey;
  error: Error;
};

export type EventApiNotificationEvent<
  T extends GameEventType | undefined = undefined,
> = GameEvent<T> & {
  eventKey: EventKey;
};
