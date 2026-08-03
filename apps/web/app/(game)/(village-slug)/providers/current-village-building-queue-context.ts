import { createContext } from 'react';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import type { ScheduledBuildingUpgrade } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';

export type BuildingUpgradeQueueEntry =
  | BuildingEvent
  | ScheduledBuildingUpgrade;

export const getBuildingUpgradeQueueEntryKey = (
  entry: Pick<BuildingUpgradeQueueEntry, 'id' | 'type'>,
): string => `${entry.type}-${entry.id}`;

export type CurrentVillageBuildingQueueContextReturn = {
  buildingEvents: BuildingEvent[];
  buildingEventByFieldId: Map<BuildingField['id'], BuildingEvent>;
  buildingUpgradeEventCountByFieldId: Map<BuildingField['id'], number>;
  buildingUpgradeEvents: BuildingUpgradeQueueEntry[];
  buildingDowngradeEvents: BuildingEvent[];
  downgradedBuildingByFieldId: Map<BuildingField['id'], BuildingEvent>;
  getBuildingEventQueue: (
    buildingFieldId: BuildingField['id'],
  ) => BuildingUpgradeQueueEntry[];
};

export const CurrentVillageBuildingQueueContext =
  createContext<CurrentVillageBuildingQueueContextReturn>(
    {} as CurrentVillageBuildingQueueContextReturn,
  );
