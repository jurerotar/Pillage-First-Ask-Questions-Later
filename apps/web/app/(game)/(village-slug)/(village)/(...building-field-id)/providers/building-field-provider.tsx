import { type PropsWithChildren, use, useMemo } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Effect } from '@pillage-first/types/models/effect';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';

const effectsThatNeedServerValueModificationInDisplay = new Set<Effect['id']>([
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
]);

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
  const { effects } = useEffects();
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

  const nextInstanceNumberByBuildingId = useMemo(() => {
    const instanceCountByBuildingId = new Map<Building['id'], number>();

    for (const { buildingId } of buildingFields) {
      instanceCountByBuildingId.set(
        buildingId,
        (instanceCountByBuildingId.get(buildingId) ?? 0) + 1,
      );
    }

    return new Map(
      [...instanceCountByBuildingId].map(([buildingId, instanceCount]) => [
        buildingId,
        instanceCount + 1,
      ]),
    );
  }, [buildingFields]);

  const { total: buildingDuration } = useMemo(() => {
    return calculateComputedEffect(
      'buildingDuration',
      effects,
      currentVillage.tileId,
    );
  }, [currentVillage.tileId, effects]);

  const serverEffectValueByEffectId = useMemo(() => {
    const values = new Map<Effect['id'], number>();

    for (const effect of effects) {
      if (
        effect.scope === 'server' &&
        effectsThatNeedServerValueModificationInDisplay.has(effect.id) &&
        !values.has(effect.id)
      ) {
        values.set(effect.id, effect.value);
      }
    }

    return values;
  }, [effects]);

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
      nextInstanceNumberByBuildingId,
      buildingDuration,
      serverEffectValueByEffectId,
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
      nextInstanceNumberByBuildingId,
      buildingDuration,
      serverEffectValueByEffectId,
    ],
  );

  return <BuildingFieldContext value={value}>{children}</BuildingFieldContext>;
};
