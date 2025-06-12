import { useMemo } from 'react';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';

export const useCurrentVillageBuildingEvents = () => {
  const { eventsByType: currentVillageBuildingLevelChangeEvents } = useEventsByType('buildingLevelChange');
  const { eventsByType: currentVillageBuildingScheduledConstructionEvents } = useEventsByType('buildingScheduledConstruction');

  const currentVillageBuildingEvents = useMemo(() => {
    return [...currentVillageBuildingLevelChangeEvents, ...currentVillageBuildingScheduledConstructionEvents].sort(
      (a, b) => a.startsAt + a.duration - (b.startsAt + b.duration),
    );
  }, [currentVillageBuildingLevelChangeEvents, currentVillageBuildingScheduledConstructionEvents]);

  return {
    currentVillageBuildingEvents,
  };
};
