import { type PropsWithChildren, use, useMemo } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';

type BuildingContextProps = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
};

export const BuildingFieldProvider = ({
  children,
  buildingField,
  buildingFieldId,
}: PropsWithChildren<BuildingContextProps>) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingUpgradeEvents } = use(CurrentVillageBuildingQueueContext);

  const { buildingFields } = currentVillage;
  const {
    doesBuildingExist,
    actualLevel,
    virtualLevel,
    isUpgrading,
    isDowngrading,
  } = useBuildingVirtualLevel(buildingFieldId);

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

    for (const ev of buildingUpgradeEvents) {
      buildingIdsInQueueSet.add(ev.buildingId);
    }

    return buildingIdsInQueueSet;
  }, [buildingUpgradeEvents]);

  const value = useMemo(
    () => ({
      buildingFieldId,
      buildingField,
      doesBuildingExist,
      actualLevel,
      virtualLevel,
      isUpgrading,
      isDowngrading,
      maxLevelByBuildingId,
      buildingIdsInQueue,
    }),
    [
      buildingFieldId,
      buildingField,
      doesBuildingExist,
      actualLevel,
      virtualLevel,
      isUpgrading,
      isDowngrading,
      maxLevelByBuildingId,
      buildingIdsInQueue,
    ],
  );

  return <BuildingFieldContext value={value}>{children}</BuildingFieldContext>;
};
