import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { useEffect } from 'react';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import {
  isEventCreatedNotificationMessageEvent,
  isEventResolvedNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const eventResolvedNotificationFactory = (
  { data: _data }: MessageEvent<EventApiNotificationEvent>,
  _t: TFunction,
  _assetsT: TFunction,
): Parameters<typeof toast> | undefined => {
  return;
};

const eventCreatedNotificationFactory = (
  { data: _data }: MessageEvent<EventApiNotificationEvent>,
  _t: TFunction,
  _assetsT: TFunction,
): Parameters<typeof toast> | undefined => {
  return;
};

export const Notifier = () => {
  const { apiWorker } = useApiWorker();
  const { preferences: _ } = usePreferences();
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (
      event: MessageEvent<EventApiNotificationEvent>,
    ) => {
      if (isEventResolvedNotificationMessageEvent(event)) {
        const toastMethod =
          event.data.eventKey === 'event:worker-event-resolve-success'
            ? 'success'
            : 'error';

        const toastArgs = eventResolvedNotificationFactory(event, t, assetsT);

        if (toastArgs) {
          toast[toastMethod](...toastArgs);
        }
      }

      if (isEventCreatedNotificationMessageEvent(event)) {
        const toastMethod =
          event.data.eventKey === 'event:worker-event-creation-success'
            ? 'success'
            : 'error';
        const toastArgs = eventCreatedNotificationFactory(event, t, assetsT);

        if (toastArgs) {
          toast[toastMethod](...toastArgs);
        }
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, t, assetsT]);

  return null;
};
