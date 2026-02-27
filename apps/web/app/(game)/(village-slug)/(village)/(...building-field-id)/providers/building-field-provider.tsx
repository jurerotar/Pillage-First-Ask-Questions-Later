import { createContext, type PropsWithChildren, useMemo } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';

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
    const maxLevelByBuildingIdMap = new Map<Building['id'], number>();

    for (const bf of buildingFields) {
      const prevMax = maxLevelByBuildingIdMap.get(bf.buildingId);
      if (prevMax === undefined || bf.level > prevMax) {
        maxLevelByBuildingIdMap.set(bf.buildingId, bf.level);
      }
    }

    return maxLevelByBuildingIdMap;
  }, [buildingFields]);

  const buildingIdsInQueue = useMemo(() => {
    const buildingIdsInQueueSet = new Set<Building['id']>();

    for (const ev of currentVillageBuildingEvents) {
      buildingIdsInQueueSet.add(ev.buildingId);
    }

    return buildingIdsInQueueSet;
  }, [currentVillageBuildingEvents]);

  const value = useMemo(
    () => ({
      buildingFieldId,
      buildingField,
      maxLevelByBuildingId,
      buildingIdsInQueue,
    }),
    [buildingFieldId, buildingField, maxLevelByBuildingId, buildingIdsInQueue],
  );

  return <BuildingFieldContext value={value}>{children}</BuildingFieldContext>;
};
