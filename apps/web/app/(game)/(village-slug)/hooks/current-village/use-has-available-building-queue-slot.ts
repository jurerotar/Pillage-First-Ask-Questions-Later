import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

const MAX_BUILDINGS_IN_QUEUE = 5;

export const useHasAvailableBuildingQueueSlot = () => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents, scheduledBuildingUpgrades } = use(
    CurrentVillageBuildingQueueContext,
  );

  const totalOccupiedSlots =
    currentVillageBuildingEvents.length + scheduledBuildingUpgrades.length;
  const canAddAdditionalBuildingToQueue =
    totalOccupiedSlots < MAX_BUILDINGS_IN_QUEUE;

  const errorBag: string[] = [];

  if (!canAddAdditionalBuildingToQueue) {
    errorBag.push(t('Building construction queue is full.'));
  }

  return {
    hasAvailableBuildingQueueSlot: errorBag.length === 0,
    errorBag,
  };
};
