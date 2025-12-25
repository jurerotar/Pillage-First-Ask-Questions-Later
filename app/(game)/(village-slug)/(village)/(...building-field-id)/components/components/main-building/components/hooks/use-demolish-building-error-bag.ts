import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import type { BuildingField } from 'app/interfaces/models/game/village';

export const useDemolishBuildingErrorBag = (
  buildingFieldId: BuildingField['id'],
) => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );

  const getBuildingDowngradeErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (
      currentVillageBuildingEvents.some(
        ({ buildingFieldId: eventBuildingFieldId }) =>
          eventBuildingFieldId === buildingFieldId,
      )
    ) {
      errorBag.push(
        t(
          "Building can't be downgraded or demolished while it's being upgraded.",
        ),
      );
    }

    return errorBag;
  };

  return {
    getBuildingDowngradeErrorBag,
  };
};
