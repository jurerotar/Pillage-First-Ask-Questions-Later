import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
  EventApiNotificationEvent,
  ScheduledBuildingConstructionCancelledNotificationEvent,
} from '@pillage-first/types/api-events';

const isNotificationMessageEvent = (
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

export const isScheduledBuildingConstructionCancelledNotificationMessageEvent =
  (
    event: MessageEvent,
  ): event is MessageEvent<ScheduledBuildingConstructionCancelledNotificationEvent> => {
    return (
      isNotificationMessageEvent(event) &&
      event.data.eventKey === 'scheduled-building-construction:cancelled'
    );
  };

export const isEventResolvedSuccessfullyNotificationMessageEvent = (
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
