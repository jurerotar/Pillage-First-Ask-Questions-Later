import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useSuspenseQuery } from '@tanstack/react-query';

export const useCurrentVillageBuildingEvents = () => {
  const { currentVillage } = useCurrentVillage();
  const { events } = useEvents();

  const getCurrentVillageBuildingEvents = (): GameEvent<'buildingConstruction'>[] => {
    return events.filter((event) => isBuildingEvent(event) && event.villageId === currentVillage.id) as GameEvent<'buildingConstruction'>[];
  };

  const { data: currentVillageBuildingEvents } = useSuspenseQuery<GameEvent<'buildingConstruction'>[]>({
    queryKey: ['current-village-building-events', events],
    queryFn: getCurrentVillageBuildingEvents,
    initialData: getCurrentVillageBuildingEvents,
    initialDataUpdatedAt: Date.now(),
    gcTime: 10_000,
    queryKeyHashFn: () => {
      const eventHash = events.map((event) => event.id).join('|');
      return `village-id-[${currentVillage.id}]-current-village-building-events-${eventHash}`;
    },
  });

  return {
    currentVillageBuildingEvents,
  };
};
