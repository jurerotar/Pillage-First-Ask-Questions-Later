import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import {
  isBuildingLevelUpEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { useNotificationPermission } from 'app/(game)/hooks/use-notification-permission';
import { useTabFocus } from 'app/(game)/hooks/use-tab-focus';
import {
  isControllerMessageErrorNotificationMessageEvent,
  isEventResolvedNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

type NotificationFactoryArgs = {
  t: TFunction;
  serverName: string;
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
  { t, serverName },
) => {
  if (isBuildingLevelUpEvent(data)) {
    const buildingName = t(`BUILDINGS.${data.buildingId}.NAME`);
    const { level } = data;

    const toastTitle = t('{{buildingName}} upgraded', {
      buildingName,
    });

    const notificationTitle = `${toastTitle} | Pillage First! - ${serverName}`;

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

    const notificationTitle = `${toastTitle} | Pillage First! - ${serverName}`;

    return {
      toastTitle,
      notificationTitle,
    };
  }

  if (isUnitImprovementEvent(data)) {
    const unitName = t(`UNITS.${data.unitId}.NAME`);
    const { level } = data;

    const toastTitle = t('{{unitName}} upgraded', {
      unitName,
    });

    const notificationTitle = `${toastTitle} | Pillage First! - ${serverName}`;

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

type NotifierProps = {
  serverSlug: Server['slug'];
};

export const Notifier = ({ serverSlug }: NotifierProps) => {
  const { t } = useTranslation();
  const { apiWorker } = useApiWorker(serverSlug);
  const { preferences } = usePreferences();
  const notificationPermission = useNotificationPermission();
  const isTabFocused = useTabFocus();
  const { server } = useServer();

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = (event: MessageEvent<EventApiNotificationEvent>) => {
      if (!isEventResolvedNotificationMessageEvent(event)) {
        return;
      }

      if (isControllerMessageErrorNotificationMessageEvent(event)) {
        const { data } = event;
        const {
          error: { message },
        } = data;

        toast.error(t('An error has occurred'), {
          description: message,
          richColors: true,
        });
      }

      const toastArgs = eventResolvedNotificationFactory(event, {
        t,
        serverName: server.name,
      });

      if (!toastArgs) {
        return;
      }

      const { toastTitle, notificationTitle, body } = toastArgs;

      toast(toastTitle, { description: body });

      if (notificationPermission !== 'granted' || isTabFocused) {
        return;
      }

      const shouldShowNotification =
        (isBuildingLevelUpEvent(event.data) &&
          preferences.shouldShowNotificationsOnBuildingUpgradeCompletion) ||
        (isUnitImprovementEvent(event.data) &&
          preferences.shouldShowNotificationsOnUnitUpgradeCompletion) ||
        (isUnitResearchEvent(event.data) &&
          preferences.shouldShowNotificationsOnAcademyResearchCompletion);

      if (!shouldShowNotification) {
        return;
      }

      new Notification(notificationTitle, { body });
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, t, notificationPermission, isTabFocused, server, preferences]);

  return null;
};
