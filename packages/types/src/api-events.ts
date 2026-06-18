import type { GameEvent, GameEventType } from './models/game-event';
import type { Village } from './models/village';

type EventKey =
  | 'event:database-initialization-success'
  | 'event:database-initialization-error'
  | 'event:success'
  | 'event:error'
  | 'event:created';

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type DatabaseInitializationErrorEvent = {
  eventKey: EventKey;
  error: Error;
};

export type ControllerErrorEvent = {
  eventKey: EventKey;
  error: Error;
};

export type EventApiNotificationEvent<
  T extends GameEventType | undefined = undefined,
> = GameEvent<T> & {
  eventKey: EventKey;
  affectedVillageIds: (Village['id'] | null)[];
};
