import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

type ApiHandlerArgs<TBody, TParams> = {
  body: TBody;
  params: TParams;
};

export type ApiHandler<TReturn, TParams = Record<string, string>, TBody = Record<string, unknown>> = (
  queryClient: QueryClient,
  args: ApiHandlerArgs<TBody, TParams>,
) => Promise<TReturn>;

export type EventNotifierEventResolvedArgs = Pick<GameEvent, 'cachesToClear'> & {
  type: 'event:resolved';
};
