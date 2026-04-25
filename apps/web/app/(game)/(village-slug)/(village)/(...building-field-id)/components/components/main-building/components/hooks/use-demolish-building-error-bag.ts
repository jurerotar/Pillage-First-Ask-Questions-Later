import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useDemolishBuildingErrorBag = (
  buildingFieldId: BuildingField['id'],
  buildingId: Building['id'],
) => {
  const { t } = useTranslation();
  const { buildingEvents } = use(CurrentVillageBuildingQueueContext);

  const getBuildingDowngradeErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (
      buildingEvents.some(
        ({ buildingFieldId: eventBuildingFieldId }) =>
          eventBuildingFieldId === buildingFieldId,
      )
    ) {
      errorBag.push(
        t(
          "{{buildingName}} can't be downgraded or demolished while it's being upgraded or downgraded.",
          {
            buildingName: t(`BUILDINGS.${buildingId}.NAME`),
          },
        ),
      );
    }

    return errorBag;
  };

  const getDemolishBuildingErrorBag = (): string[] => {
    const errorBag: string[] = [];

    if (
      buildingEvents.some(({ previousLevel, level }) => previousLevel > level)
    ) {
      errorBag.push(t('A building is already being demolished or downgraded.'));
    }

    return errorBag;
  };

  return {
    getBuildingDowngradeErrorBag,
    getDemolishBuildingErrorBag,
  };
};
