import type {
  GameEvent,
  GameEventType,
} from 'app/interfaces/models/game/game-event';
import type { DbFacade } from 'app/(game)/api/database-facade';

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
) => void;

type ParamType<T extends string> = T extends
  | 'villageId'
  | 'playerId'
  | 'tileId'
  | 'oasisId'
  ? number
  : string;

type ApiHandlerArgs<TBody, TParams extends string> = {
  body: TBody;
  params: {
    [K in TParams]: ParamType<K>;
  };
};

export type ApiHandler<
  TReturn = void,
  TParams extends string = '',
  TBody = Record<string, unknown>,
> = (database: DbFacade, args: ApiHandlerArgs<TBody, TParams>) => TReturn;

type EventKey =
  | 'event:worker-initialization-success'
  | 'event:worker-initialization-error'
  | 'event:worker-event-creation-success'
  | 'event:worker-event-creation-error'
  | 'event:worker-event-resolve-success'
  | 'event:worker-event-resolve-error'
  | 'event:locale-changed';

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
