import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

const MAX_BUILDINGS_IN_QUEUE = 5;

export const useHasAvailableBuildingQueueSlot = (
  buildingFieldId: BuildingField['id'],
) => {
  const { t } = useTranslation();
  const { buildingUpgradeEvents, downgradedBuildingByFieldId } = use(
    CurrentVillageBuildingQueueContext,
  );

  const canAddAdditionalBuildingToQueue =
    buildingUpgradeEvents.length < MAX_BUILDINGS_IN_QUEUE;

  const errorBag: string[] = [];

  if (!canAddAdditionalBuildingToQueue) {
    errorBag.push(t('Building construction queue is full.'));
  }

  const downgradedBuilding = downgradedBuildingByFieldId.get(buildingFieldId);

  if (downgradedBuilding) {
    const { buildingId } = downgradedBuilding;
    errorBag.push(
      t('{{buildingName}} is currently being downgraded or demolished.', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`),
      }),
    );
  }

  return {
    hasAvailableBuildingQueueSlot: errorBag.length === 0,
    errorBag,
  };
};
