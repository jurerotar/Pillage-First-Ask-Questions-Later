import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';

export const useCurrentVillageBuildingEvents = () => {
  const { eventsByType: currentVillageBuildingEvents } = useEventsByType(
    'buildingLevelChange',
  );

  return {
    currentVillageBuildingEvents,
  };
};
