import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
} from 'app/interfaces/api';

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
    event.data.eventKey === 'event:worker-event-resolve-success'
  );
};
