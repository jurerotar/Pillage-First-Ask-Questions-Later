import type { GameEvent, GameEventType } from './models/game-event';

type EventKey =
  | 'event:database-initialization-success'
  | 'event:database-initialization-error'
  | 'event:controller-success'
  | 'event:controller-error'
  | 'event:event-resolve-success'
  | 'event:event-resolve-error';

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
