import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
  EventApiNotificationEvent,
} from '@pillage-first/types/api-events';

export const isNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<ApiNotificationEvent> => {
  const { data } = event;
  return Object.hasOwn(data, 'eventKey');
};

export const isEventResolvedNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    (event.data.eventKey === 'event:success' ||
      event.data.eventKey === 'event:error')
  );
};

export const isEventCreatedNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) && event.data.eventKey === 'event:created'
  );
};

export const isEventResolvedSuccessfullyNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) && event.data.eventKey === 'event:success'
  );
};

export const isEventResolvedUnsuccessfullyNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) && event.data.eventKey === 'event:error'
  );
};

export const isControllerMessageNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    (event.data.eventKey === 'event:success' ||
      event.data.eventKey === 'event:error')
  );
};

export const isControllerMessageSuccessfulNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) && event.data.eventKey === 'event:success'
  );
};

export const isControllerMessageErrorNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<ControllerErrorEvent> => {
  return (
    isNotificationMessageEvent(event) && event.data.eventKey === 'event:error'
  );
};

export const isDatabaseInitializationSuccessNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<ApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    event.data.eventKey === 'event:database-initialization-success'
  );
};

export const isDatabaseInitializationErrorNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<DatabaseInitializationErrorEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    event.data.eventKey === 'event:database-initialization-error'
  );
};
