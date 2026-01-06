import { use } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

export const useBuildingVirtualLevel = (
  buildingId: Building['id'],
  buildingFieldId: BuildingField['id'],
) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );

  const building = currentVillage.buildingFields.find(
    ({ id }) => id === buildingFieldId,
  );
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;

  const virtualLevel = (() => {
    const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(
      ({
        buildingFieldId: eventBuildingFieldId,
        buildingId: buildingUnderConstructionId,
      }) => {
        return (
          buildingUnderConstructionId === buildingId &&
          eventBuildingFieldId === buildingFieldId
        );
      },
    );

    if (sameBuildingConstructionEvents.length > 0) {
      return (
        (currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)
          ?.level ?? 0) + sameBuildingConstructionEvents.length
      );
    }

    return actualLevel;
  })();

  return {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
  };
};
