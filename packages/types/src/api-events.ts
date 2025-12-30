import type { GameEvent, GameEventType } from './models/game-event';

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
