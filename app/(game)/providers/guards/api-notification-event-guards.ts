import type { ApiNotificationEvent, EventResolvedApiNotificationEvent } from 'app/interfaces/api';
import { eventResolvedKey } from 'app/(game)/keys/event-keys';

export const isNotificationMessageEvent = (event: MessageEvent): event is MessageEvent<ApiNotificationEvent> => {
  const { data } = event;
  return Object.hasOwn(data, 'eventKey');
};

export const isEventResolvedNotificationMessageEvent = (event: MessageEvent): event is MessageEvent<EventResolvedApiNotificationEvent> => {
  return isNotificationMessageEvent(event) && event.data.eventKey === eventResolvedKey;
};
