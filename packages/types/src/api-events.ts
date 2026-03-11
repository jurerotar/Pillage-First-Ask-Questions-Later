import type { GameEvent, GameEventType } from './models/game-event';

type EventKey =
  | 'event:database-initialization-success'
  | 'event:database-initialization-error'
  | 'event:scheduler-start-success'
  | 'event:scheduler-start-error'
  | 'event:success'
  | 'event:error';

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type DatabaseInitializationSuccessEvent = {
  eventKey: 'event:database-initialization-success';
  appTime: number;
  isVacationModeEnabled: boolean;
};

export type DatabaseInitializationErrorEvent = {
  eventKey: 'event:database-initialization-error';
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
};
