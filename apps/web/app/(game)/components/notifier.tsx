import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
} from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import {
  isAdventureTroopMovementEvent,
  isBuildingLevelUpEvent,
  isFindNewVillageTroopMovementEvent,
  isHeroRevivalEvent,
  isOasisOccupationTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isTroopTrainingEvent,
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
  isEventCreatedNotificationMessageEvent,
  isEventResolvedNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

type NotificationFactoryArgs = {
  t: TFunction;
  serverName: string;
};

type NotificationInfo = {
  toastTitle: string;
  notificationTitle?: string;
  body?: string;
};

const getEventResolvedInfo = (
  event: EventApiNotificationEvent,
  { t, serverName }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelUpEvent(event)) {
    const buildingName = t(`BUILDINGS.${event.buildingId}.NAME`);
    const { level } = event;

    const toastTitle = t('{{buildingName}} upgraded', {
      buildingName,
    });

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t('{{buildingName}} was upgraded to level {{level}}', {
        buildingName,
        level,
      }),
    };
  }

  if (isUnitResearchEvent(event)) {
    const unitName = t(`UNITS.${event.unitId}.NAME`);

    const toastTitle = t('{{unitName}} researched', {
      unitName,
    });

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
    };
  }

  if (isUnitImprovementEvent(event)) {
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { level } = event;

    const toastTitle = t('{{unitName}} upgraded', {
      unitName,
    });

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t('{{unitName}} was upgraded to level {{level}}', {
        unitName,
        level,
      }),
    };
  }

  return;
};

const getEventCreatedInfo = (
  event: EventApiNotificationEvent,
  { t }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelUpEvent(event)) {
    const buildingName = t(`BUILDINGS.${event.buildingId}.NAME`);
    const { level } = event;

    return {
      toastTitle: t('{{buildingName}} level {{level}} upgrade started', {
        buildingName,
        level,
      }),
    };
  }

  if (isUnitResearchEvent(event)) {
    const unitName = t(`UNITS.${event.unitId}.NAME`);

    return {
      toastTitle: t('{{unitName}} research started', {
        unitName,
      }),
    };
  }

  if (isUnitImprovementEvent(event)) {
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { level } = event;

    return {
      toastTitle: t('{{unitName}} level {{level}} upgrade started', {
        unitName,
        level,
      }),
    };
  }

  if (isAdventureTroopMovementEvent(event)) {
    return { toastTitle: t('Hero sent on adventure') };
  }

  if (isHeroRevivalEvent(event)) {
    return { toastTitle: t('Hero revival started') };
  }

  if (isReinforcementsTroopMovementEvent(event)) {
    return { toastTitle: t('Reinforcements sent') };
  }

  if (isRelocationTroopMovementEvent(event)) {
    return { toastTitle: t('Relocation started') };
  }

  if (isFindNewVillageTroopMovementEvent(event)) {
    return { toastTitle: t('Settlers sent to find new village') };
  }

  if (isOasisOccupationTroopMovementEvent(event)) {
    return { toastTitle: t('Troops sent to occupy oasis') };
  }

  if (isTroopTrainingEvent(event)) {
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { amount } = event;

    return {
      toastTitle: t('Added {{count}} {{unitName}} to training queue', {
        count: amount,
        unitName,
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

    const handleMessage = (event: MessageEvent<ApiNotificationEvent>) => {
      if (isEventCreatedNotificationMessageEvent(event)) {
        const { data } = event;
        const info = getEventCreatedInfo(data, {
          t,
          serverName: server.name,
        });

        if (info) {
          toast(info.toastTitle);
        }
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
        return;
      }

      if (!isEventResolvedNotificationMessageEvent(event)) {
        return;
      }

      const { data } = event;

      const info = getEventResolvedInfo(data, {
        t,
        serverName: server.name,
      });

      if (!info) {
        return;
      }

      const { toastTitle, notificationTitle, body } = info;

      toast(toastTitle, { description: body });

      if (notificationPermission !== 'granted' || isTabFocused) {
        return;
      }

      const shouldShowNotification =
        (isBuildingLevelUpEvent(data) &&
          preferences.shouldShowNotificationsOnBuildingUpgradeCompletion) ||
        (isUnitImprovementEvent(data) &&
          preferences.shouldShowNotificationsOnUnitUpgradeCompletion) ||
        (isUnitResearchEvent(data) &&
          preferences.shouldShowNotificationsOnAcademyResearchCompletion);

      if (shouldShowNotification && notificationTitle) {
        new Notification(notificationTitle, { body });
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker, t, notificationPermission, isTabFocused, server, preferences]);

  return null;
};
