import { use } from 'react';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import type { BuildingField } from 'app/interfaces/models/game/building-field';
import { useTranslation } from 'react-i18next';

// TODO: Raise this to 5 once you figure out how to solve the scheduledBuildingEvent bug
const MAX_BUILDINGS_IN_QUEUE = 1;

export const useHasAvailableBuildingQueueSlot = (
  buildingFieldId: BuildingField['id'],
) => {
  const { t } = useTranslation();
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);

  const currentVillageBuildingEventsQueue =
    getBuildingEventQueue(buildingFieldId);
  const canAddAdditionalBuildingToQueue =
    currentVillageBuildingEventsQueue.length < MAX_BUILDINGS_IN_QUEUE;

  const errorBag: string[] = [];

  if (!canAddAdditionalBuildingToQueue) {
    errorBag.push(t('Building construction queue is full.'));
  }

  return {
    hasAvailableBuildingQueueSlot: errorBag.length === 0,
    errorBag,
  };
};
