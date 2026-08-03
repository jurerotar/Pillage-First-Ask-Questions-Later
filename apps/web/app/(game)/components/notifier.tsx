import type { TFunction } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  ScheduledBuildingConstructionCancelledNotificationEvent,
} from '@pillage-first/types/api-events';
import type { Server } from '@pillage-first/types/models/server';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Village } from '@pillage-first/types/models/village';
import { formatNumber } from '@pillage-first/utils/format';
import {
  isAdventureTroopMovementEvent,
  isAnimalCageProductionEvent,
  isBuildingLevelChangeEvent,
  isFindNewVillageTroopMovementEvent,
  isGatherersHutGatheringTripEvent,
  isHeroRevivalEvent,
  isHuntersLodgeHuntEvent,
  isOasisOccupationTroopMovementEvent,
  isReinforcementsTroopMovementEvent,
  isRelocationTroopMovementEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { tileIdToCoordinates } from '@pillage-first/utils/map';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { useNotificationPermission } from 'app/(game)/hooks/use-notification-permission';
import { useTabFocus } from 'app/(game)/hooks/use-tab-focus';
import {
  isControllerMessageErrorNotificationMessageEvent,
  isEventCreatedNotificationMessageEvent,
  isEventResolvedNotificationMessageEvent,
  isScheduledBuildingConstructionCancelledNotificationMessageEvent,
} from 'app/(game)/providers/guards/api-notification-event-guards';

type NotificationFactoryArgs = {
  t: TFunction;
  serverName: string;
  mapSize: Server['configuration']['mapSize'];
  playerVillagesMap: Map<Village['id'], Village['name']>;
};

type NotificationInfo = {
  toastTitle: string;
  notificationTitle?: string;
  body?: string;
};

const getTileCoordinates = (
  tileId: number,
  mapSize: Server['configuration']['mapSize'],
) => tileIdToCoordinates(tileId, mapSize);

const getTroopAmount = (troops: Troop[]) => {
  let troopAmount = 0;

  for (const troop of troops) {
    troopAmount += troop.amount;
  }

  return troopAmount;
};

const getGatheredResourcesText = (
  troopAmount: number,
  t: TFunction,
): string => {
  const [wood, clay, iron, wheat] =
    calculateGatherersHutGatheringResources(troopAmount);

  return [
    t('{{amount}} wood', { amount: formatNumber(wood) }),
    t('{{amount}} clay', { amount: formatNumber(clay) }),
    t('{{amount}} iron', { amount: formatNumber(iron) }),
    t('{{amount}} wheat', { amount: formatNumber(wheat) }),
  ].join(', ');
};

const getEventResolvedInfo = (
  event: EventApiNotificationEvent,
  { t, serverName, mapSize, playerVillagesMap }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelChangeEvent(event)) {
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
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    const toastTitle = t('Relocation finished');

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        'Troops relocated to coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isFindNewVillageTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    const toastTitle = t('New village founded');

    return {
      toastTitle,
      notificationTitle: `${toastTitle} | Pillage First! - ${serverName}`,
      body: t(
        'Settlers from {{villageName}} found a new village at coordinates ({{x}}|{{y}})',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isGatherersHutGatheringTripEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const troopAmount = getTroopAmount(event.troops);

    return {
      toastTitle: t('Gathering expedition returned to {{villageName}}', {
        villageName,
      }),
      body: t('{{resources}} gathered by {{count}} troops', {
        count: troopAmount,
        resources: getGatheredResourcesText(troopAmount, t),
      }),
    };
  }

  if (isHuntersLodgeHuntEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;

    return {
      toastTitle: t('Hunting party returned to {{villageName}}', {
        villageName,
      }),
      body: t('Hunting party returned with captured animals.', {
        level: event.huntingPartyLevel,
      }),
    };
  }

  return;
};

const getEventCreatedInfo = (
  event: EventApiNotificationEvent,
  { t, mapSize, playerVillagesMap }: NotificationFactoryArgs,
): NotificationInfo | undefined => {
  if (isBuildingLevelChangeEvent(event)) {
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
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    return {
      toastTitle: t(
        'Reinforcements sent to coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isRelocationTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    return {
      toastTitle: t(
        'Relocation of troops to coordinates ({{x}}|{{y}}) has started from {{villageName}}',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isFindNewVillageTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    return {
      toastTitle: t(
        'Settlers sent to found a new village at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isOasisOccupationTroopMovementEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const { x, y } = getTileCoordinates(event.targetTileId, mapSize);

    return {
      toastTitle: t(
        'Troops sent to occupy oasis at coordinates ({{x}}|{{y}}) from {{villageName}}',
        {
          villageName,
          x,
          y,
        },
      ),
    };
  }

  if (isGatherersHutGatheringTripEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;
    const troopAmount = getTroopAmount(event.troops);

    return {
      toastTitle: t(
        'Gathering party of {{count}} troops sent out from {{villageName}}',
        {
          count: troopAmount,
          villageName,
        },
      ),
    };
  }

  if (isHuntersLodgeHuntEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;

    return {
      toastTitle: t(
        'Level {{level}} hunting party sent out from {{villageName}}',
        {
          level: event.huntingPartyLevel,
          villageName,
        },
      ),
    };
  }

  if (isAnimalCageProductionEvent(event)) {
    const villageName = playerVillagesMap.get(event.villageId)!;

    return {
      toastTitle: t(
        'Added {{count}} animal cages to production queue in {{villageName}}',
        {
          count: event.cageAmount,
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

const getScheduledBuildingConstructionCancelledInfo = (
  event: ScheduledBuildingConstructionCancelledNotificationEvent,
  { t, playerVillagesMap }: NotificationFactoryArgs,
): NotificationInfo => {
  const villageName = playerVillagesMap.get(event.villageId)!;
  const buildingName = t(`BUILDINGS.${event.buildingId}.NAME`);
  const { level, reason } = event;

  return {
    toastTitle: t(
      level === 1
        ? '{{buildingName}} construction cancelled in {{villageName}}'
        : '{{buildingName}} level {{level}} upgrade cancelled in {{villageName}}',
      {
        buildingName,
        level,
        villageName,
      },
    ),
    body: t(
      reason === 'missing-resources'
        ? 'Queued construction was cancelled because resources were missing when it tried to start.'
        : 'Queued construction was cancelled because requirements were missing when it tried to start.',
    ),
  };
};

type NotifierProps = {
  serverSlug: Server['slug'];
};

export const Notifier = ({ serverSlug }: NotifierProps) => {
  const { t } = useTranslation();
  const { subscribeToApiWorkerNotifications } = useApiWorker(serverSlug);
  const { preferences } = usePreferences();
  const notificationPermission = useNotificationPermission();
  const isTabFocused = useTabFocus();
  const { server, mapSize } = useServer();
  const { playerVillages } = usePlayerVillageListing();

  const playerVillagesMap = useMemo(() => {
    return new Map<Village['id'], Village['name']>(
      playerVillages.map(({ id, name }) => [id, name]),
    );
  }, [playerVillages]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent<ApiNotificationEvent>) => {
      if (isEventCreatedNotificationMessageEvent(event)) {
        const { data } = event;
        const info = getEventCreatedInfo(data, {
          t,
          serverName: server.name,
          mapSize,
          playerVillagesMap,
        });

        if (info) {
          toast(info.toastTitle);
        }
        return;
      }

      if (
        isScheduledBuildingConstructionCancelledNotificationMessageEvent(event)
      ) {
        const { data } = event;
        const { toastTitle, body } =
          getScheduledBuildingConstructionCancelledInfo(data, {
            t,
            serverName: server.name,
            mapSize,
            playerVillagesMap,
          });

        toast.warning(toastTitle, {
          description: body,
          richColors: true,
        });
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
        mapSize,
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
        (isBuildingLevelChangeEvent(data) &&
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

    return subscribeToApiWorkerNotifications(handleMessage);
  }, [
    t,
    notificationPermission,
    isTabFocused,
    server,
    mapSize,
    preferences,
    playerVillagesMap,
    subscribeToApiWorkerNotifications,
  ]);

  return null;
};
