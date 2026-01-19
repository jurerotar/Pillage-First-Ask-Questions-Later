import { use, useMemo } from 'react';
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

  const building = useMemo(() => {
    return currentVillage.buildingFields.find(
      ({ id }) => id === buildingFieldId,
    );
  }, [currentVillage.buildingFields, buildingFieldId]);
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;

  const virtualLevel = useMemo(() => {
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
      return actualLevel + sameBuildingConstructionEvents.length;
    }

    return actualLevel;
  }, [currentVillageBuildingEvents, buildingId, buildingFieldId, actualLevel]);

  return {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
  };
};
