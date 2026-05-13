import type { TFunction } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
} from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import type { Village } from '@pillage-first/types/models/village';
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
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
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
  playerVillagesMap: Map<Village['id'], Village['name']>;
};

type NotificationInfo = {
  toastTitle: string;
  notificationTitle?: string;
  body?: string;
};

const getEventResolvedInfo = (
  event: EventApiNotificationEvent,
  { t, serverName, playerVillagesMap }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelUpEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const buildingName = t(`BUILDINGS.${event.buildingId}.NAME`);
    const { level, previousLevel } = event;
    const isDowngradeEvent = level < previousLevel;

    const toastTitle = t(
      isDowngradeEvent
        ? '{{buildingName}} downgraded in {{villageName}}'
        : '{{buildingName}} upgraded in {{villageName}}',
      {
        buildingName,
        villageName,
      },
    );

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        isDowngradeEvent
          ? '{{buildingName}} was downgraded to level {{level}} in {{villageName}}'
          : '{{buildingName}} was upgraded to level {{level}} in {{villageName}}',
        {
          buildingName,
          level,
          villageName,
        },
      ),
    };
  }

  if (isUnitResearchEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const unitName = t(`UNITS.${event.unitId}.NAME`);

    const toastTitle = t('{{unitName}} researched in {{villageName}}', {
      unitName,
      villageName,
    });

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
    };
  }

  if (isUnitImprovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { level } = event;

    const toastTitle = t('{{unitName}} upgraded in {{villageName}}', {
      unitName,
      villageName,
    });

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        '{{unitName}} was upgraded to level {{level}} in {{villageName}}',
        {
          unitName,
          level,
          villageName,
        },
      ),
    };
  }

  if (isRelocationTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    const toastTitle = t('Relocation finished');

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        'Troops relocated to village at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  if (isFindNewVillageTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    const toastTitle = t('New village founded');

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        'Settlers from {{villageName}} found a new village at ({{x}}|{{y}})',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  return;
};

const getEventCreatedInfo = (
  event: EventApiNotificationEvent,
  { t, playerVillagesMap }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelUpEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const buildingName = t(`BUILDINGS.${event.buildingId}.NAME`);
    const { level, previousLevel } = event;
    const isDowngradeEvent = level < previousLevel;

    return {
      toastTitle: t(
        isDowngradeEvent
          ? '{{buildingName}} level {{level}} downgrade started in {{villageName}}'
          : '{{buildingName}} level {{level}} upgrade started in {{villageName}}',
        {
          buildingName,
          level,
          villageName,
        },
      ),
    };
  }

  if (isUnitResearchEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const unitName = t(`UNITS.${event.unitId}.NAME`);

    return {
      toastTitle: t('{{unitName}} research started in {{villageName}}', {
        unitName,
        villageName,
      }),
    };
  }

  if (isUnitImprovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { level } = event;

    return {
      toastTitle: t(
        '{{unitName}} level {{level}} upgrade started in {{villageName}}',
        {
          unitName,
          level,
          villageName,
        },
      ),
    };
  }

  if (isAdventureTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    return {
      toastTitle: t('Hero sent on adventure from {{villageName}}', {
        villageName,
      }),
    };
  }

  if (isHeroRevivalEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    return {
      toastTitle: t('Hero revival started in {{villageName}}', { villageName }),
    };
  }

  if (isReinforcementsTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    return {
      toastTitle: t(
        'Reinforcements sent to village at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  if (isRelocationTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    return {
      toastTitle: t(
        'Relocation of troops to village at coordinates ({{x}}|{{y}}) has started from {{villageName}}',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  if (isFindNewVillageTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    return {
      toastTitle: t(
        'Settlers sent to found a new village at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  if (isOasisOccupationTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { targetCoordinates } = event;

    return {
      toastTitle: t(
        'Troops sent to occupy oasis at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          x: targetCoordinates.x,
          y: targetCoordinates.y,
          villageName,
        },
      ),
    };
  }

  if (isTroopTrainingEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const unitName = t(`UNITS.${event.unitId}.NAME`);
    const { amount } = event;

    return {
      toastTitle: t(
        'Added {{count}} {{unitName}} to training queue in {{villageName}}',
        {
          count: amount,
          unitName,
          villageName,
        },
      ),
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
  const { playerVillages } = usePlayerVillageListing();

  const playerVillagesMap = useMemo(() => {
    return new Map<Village['id'], Village['name']>(
      playerVillages.map(({ id, name }) => [id, name]),
    );
  }, [playerVillages]);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = async (event: MessageEvent<ApiNotificationEvent>) => {
      if (isEventCreatedNotificationMessageEvent(event)) {
        const { data } = event;
        const info = getEventCreatedInfo(data, {
          t,
          serverName: server.name,
          playerVillagesMap,
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
        playerVillagesMap,
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
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(notificationTitle, { body });
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [
    apiWorker,
    t,
    notificationPermission,
    isTabFocused,
    server,
    preferences,
    playerVillagesMap,
  ]);

  return null;
};
