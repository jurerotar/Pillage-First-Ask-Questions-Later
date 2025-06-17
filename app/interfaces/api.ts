import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

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
  | 'event:worker-ready'
  | 'event:resolved'
  | 'event:construction-not-started'
  | 'event:construction-started'
  | 'event:construction-completed';

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type EventResolvedApiNotificationEvent = ApiNotificationEvent &
  Pick<GameEvent, 'cachesToClearOnResolve'>;
