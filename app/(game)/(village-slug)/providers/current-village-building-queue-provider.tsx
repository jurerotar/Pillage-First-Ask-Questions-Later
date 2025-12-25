import type { PropsWithChildren } from 'react';
import { createContext, useMemo } from 'react';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { partition } from 'app/utils/common';

type CurrentVillageBuildingQueueContextReturn = {
  currentVillageBuildingEvents: GameEvent<'buildingLevelChange'>[];
  getBuildingEventQueue: (
    buildingFieldId: BuildingField['id'],
  ) => GameEvent<'buildingConstruction'>[];
};

export const CurrentVillageBuildingQueueContext =
  createContext<CurrentVillageBuildingQueueContextReturn>(
    {} as CurrentVillageBuildingQueueContextReturn,
  );

export const CurrentVillageBuildingQueueContextProvider = ({
  children,
}: PropsWithChildren) => {
  const tribe = useTribe();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const buildingEventQueues = useMemo(() => {
    const [resourceQueue, villageQueue] = partition<
      GameEvent<'buildingConstruction'>
    >(currentVillageBuildingEvents, (event) => event.buildingFieldId <= 18);

    return {
      resourceQueue,
      villageQueue,
    };
  }, [currentVillageBuildingEvents]);

  const getBuildingEventQueue = (
    buildingFieldId: BuildingField['id'],
  ): GameEvent<'buildingConstruction'>[] => {
    if (tribe !== 'romans') {
      return currentVillageBuildingEvents;
    }

    return buildingFieldId <= 18
      ? buildingEventQueues.resourceQueue
      : buildingEventQueues.villageQueue;
  };

  const value = {
    currentVillageBuildingEvents,
    getBuildingEventQueue,
  };

  return (
    <CurrentVillageBuildingQueueContext value={value}>
      {children}
    </CurrentVillageBuildingQueueContext>
  );
};
