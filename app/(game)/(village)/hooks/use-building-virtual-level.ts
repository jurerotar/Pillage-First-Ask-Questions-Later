import { useCurrentVillage } from 'app/(game)/hooks/current-village/use-current-village';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { useCurrentVillageBuildingEvents } from 'app/(game)/hooks/current-village/use-current-village-building-events';

export const useBuildingVirtualLevel = (buildingId: Building['id'], buildingFieldId: BuildingField['id']) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const building = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId);
  const doesBuildingExist = !!building;

  const actualLevel = building?.level ?? 0;

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
