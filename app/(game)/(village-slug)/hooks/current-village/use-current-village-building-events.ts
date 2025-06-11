import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';

export const useCurrentVillageBuildingEvents = () => {
  const { eventsByType: currentVillageBuildingLevelChangeEvents } = useEventsByType('buildingLevelChange');
  const { eventsByType: currentVillageBuildingConstructionEvents } = useEventsByType('buildingConstruction');

  const currentVillageBuildingEvents = [...currentVillageBuildingLevelChangeEvents, ...currentVillageBuildingConstructionEvents];

  return {
    currentVillageBuildingEvents,
  };
};
