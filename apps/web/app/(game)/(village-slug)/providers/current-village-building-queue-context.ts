import { createContext } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';

export type CurrentVillageBuildingQueueContextReturn = {
  buildingEvents: BuildingEvent[];
  buildingEventByFieldId: Map<BuildingField['id'], BuildingEvent>;
  buildingUpgradeEventCountByFieldId: Map<BuildingField['id'], number>;
  buildingUpgradeEvents: BuildingEvent[];
  buildingDowngradeEvents: BuildingEvent[];
  downgradedBuildingByFieldId: Map<BuildingField['id'], BuildingEvent>;
  getBuildingEventQueue: (
    buildingFieldId: BuildingField['id'],
  ) => BuildingEvent[];
};

export const CurrentVillageBuildingQueueContext =
  createContext<CurrentVillageBuildingQueueContextReturn>(
    {} as CurrentVillageBuildingQueueContextReturn,
  );
