import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { use } from 'react';

export const useBuildingVirtualLevel = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { currentVillage } = use(CurrentVillageContext);
  const { getCurrentVillageBuildingEvents } = useEvents();

  const building = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId);
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;
  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

  const virtualLevel = (() => {
    const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(({ buildingFieldId: eventBuildingFieldId, building }) => {
      return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
    });

    if (sameBuildingConstructionEvents.length > 0) {
      return (currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0) + sameBuildingConstructionEvents.length;
    }

    return actualLevel;
  })();

  return {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
  };
};
