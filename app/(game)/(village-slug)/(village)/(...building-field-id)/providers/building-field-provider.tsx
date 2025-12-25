import { createContext, type PropsWithChildren, useMemo } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

type BuildingContextProps = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
};

export type BuildingContextReturn = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
  maxLevelByBuildingId: Map<Building['id'], number>;
  buildingIdsInQueue: Set<Building['id']>;
};

export const BuildingFieldContext = createContext<BuildingContextReturn>(
  {} as never,
);

export const BuildingFieldProvider = ({
  children,
  buildingField,
  buildingFieldId,
}: PropsWithChildren<BuildingContextProps>) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  const { buildingFields } = currentVillage;

  const maxLevelByBuildingId = useMemo(() => {
    const maxLevelByBuildingId = new Map<Building['id'], number>();

    for (const bf of buildingFields) {
      const prevMax = maxLevelByBuildingId.get(bf.buildingId);
      if (prevMax === undefined || bf.level > prevMax) {
        maxLevelByBuildingId.set(bf.buildingId, bf.level);
      }
    }

    return maxLevelByBuildingId;
  }, [buildingFields]);

  const buildingIdsInQueue = useMemo(() => {
    const buildingIdsInQueue = new Set<Building['id']>();

    for (const ev of currentVillageBuildingEvents) {
      buildingIdsInQueue.add(ev.buildingId);
    }

    return buildingIdsInQueue;
  }, [currentVillageBuildingEvents]);

  const value = {
    buildingFieldId,
    buildingField,
    maxLevelByBuildingId,
    buildingIdsInQueue,
  };

  return <BuildingFieldContext value={value}>{children}</BuildingFieldContext>;
};
