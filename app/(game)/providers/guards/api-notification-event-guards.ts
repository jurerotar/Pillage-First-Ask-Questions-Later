import type {
  ApiNotificationEvent,
  EventResolvedApiNotificationEvent,
} from 'app/interfaces/api';

export const isNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<ApiNotificationEvent> => {
  const { data } = event;
  return Object.hasOwn(data, 'eventKey');
};

export const isEventResolvedNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventResolvedApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    event.data.eventKey === 'event:resolved'
  );
};

export const isEventNotStartedNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventResolvedApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    event.data.eventKey === 'event:construction-not-started'
  );
};
