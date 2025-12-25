import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  isBuildingLevelUpEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from 'app/(game)/guards/event-guards';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { useNotificationPermission } from 'app/(game)/hooks/use-notification-permission';
import { useTabFocus } from 'app/(game)/hooks/use-tab-focus';
import {
  isEventCreatedNotificationMessageEvent,
  isEventResolvedNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';
import type { EventApiNotificationEvent } from 'app/interfaces/api';
import type { Server } from 'app/interfaces/models/game/server';

type NotificationFactoryArgs = {
  t: TFunction;
  server: Server;
};

type NotificationFactoryReturn =
  | {
      toastTitle: string;
      notificationTitle: string;
      body?: string;
    }
  | undefined;

type NotificationFactory = (
  event: MessageEvent<EventApiNotificationEvent>,
  args: NotificationFactoryArgs,
) => NotificationFactoryReturn | undefined;

const eventResolvedNotificationFactory: NotificationFactory = (
  { data },
  args,
) => {
  const { t, server } = args;

  if (isBuildingLevelUpEvent(data)) {
    const buildingName = t(`BUILDINGS.${data.buildingId}.NAME`);
    const level = data.level;

    const toastTitle = t('{{buildingName}} upgraded', {
      buildingName,
    });

    const notificationTitle = `${toastTitle} | Pillage First! - ${server.slug}`;

    return {
      toastTitle,
      notificationTitle,
      body: t('{{buildingName}} was upgraded to level {{level}}', {
        buildingName,
        level,
      }),
    };
  }

  if (isUnitResearchEvent(data)) {
    const unitName = t(`UNITS.${data.unitId}.NAME`);

    const toastTitle = t('{{unitName}} researched', {
      unitName,
    });

    const notificationTitle = `${toastTitle} | Pillage First! - ${server.slug}`;

    return {
      toastTitle,
      notificationTitle,
    };
  }

  if (isUnitImprovementEvent(data)) {
    const unitName = t(`UNITS.${data.unitId}.NAME`);
    const level = data.level;

    const toastTitle = t('{{unitName}} upgraded', {
      unitName,
    });

    const notificationTitle = `${toastTitle} | Pillage First! - ${server.slug}`;

    return {
      toastTitle,
      notificationTitle,
      body: t('{{unitName}} was upgraded to level {{level}}', {
        unitName,
        level,
      }),
    };
  }

  return;
};

const eventCreatedNotificationFactory: NotificationFactory = (
  { data: _data },
  _args,
) => {
  return undefined;
};

type NotifierProps = {
  serverSlug: Server['slug'];
};

export const Notifier = ({ serverSlug }: NotifierProps) => {
  const { apiWorker } = useApiWorker(serverSlug);
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const notificationPermission = useNotificationPermission();
  const isTabFocused = useTabFocus();
  const { server } = useServer();

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (
      event: MessageEvent<EventApiNotificationEvent>,
    ) => {
      if (isEventResolvedNotificationMessageEvent(event)) {
        const toastArgs = eventResolvedNotificationFactory(event, {
          t,
          server,
        });

        if (toastArgs) {
          const { toastTitle, notificationTitle, body } = toastArgs;

          toast(toastTitle, { description: body });

          if (notificationPermission === 'granted' && !isTabFocused) {
            if (
              isBuildingLevelUpEvent(event.data) &&
              preferences.shouldShowNotificationsOnBuildingUpgradeCompletion
            ) {
              new Notification(notificationTitle, { body });
            }
            if (
              isUnitImprovementEvent(event.data) &&
              preferences.shouldShowNotificationsOnUnitUpgradeCompletion
            ) {
              new Notification(notificationTitle, { body });
            }
            if (
              isUnitResearchEvent(event.data) &&
              preferences.shouldShowNotificationsOnAcademyResearchCompletion
            ) {
              new Notification(notificationTitle, { body });
            }
          }
        }
      }

      if (isEventCreatedNotificationMessageEvent(event)) {
        const toastArgs = eventCreatedNotificationFactory(event, { t, server });

        if (toastArgs) {
          const { toastTitle, body } = toastArgs;

          toast(toastTitle, { description: body });
        }
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, t, notificationPermission, isTabFocused, server, preferences]);

  return null;
};
