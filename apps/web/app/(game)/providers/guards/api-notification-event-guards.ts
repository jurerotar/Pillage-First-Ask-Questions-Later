import type {
  ApiNotificationEvent,
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
    (event.data.eventKey === 'event:worker-event-resolve-success' ||
      event.data.eventKey === 'event:worker-event-resolve-error')
  );
};

export const isEventCreatedNotificationMessageEvent = (
  event: MessageEvent,
): event is MessageEvent<EventApiNotificationEvent> => {
  return (
    isNotificationMessageEvent(event) &&
    (event.data.eventKey === 'event:worker-event-creation-success' ||
      event.data.eventKey === 'event:worker-event-creation-error')
  );
};
