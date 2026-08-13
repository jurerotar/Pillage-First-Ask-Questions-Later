import { useCallback, useMemo } from 'react';
import { buildings } from '@pillage-first/game-assets/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { CatapultTarget } from '@pillage-first/types/models/game-event';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { UnitSelection } from '../utils/schema';

type TribeBuildingRequirement = Extract<
  Building['buildingRequirements'][number],
  { type: 'tribe' }
>;

type CatapultTargetData = {
  action: 'attack' | 'raid';
  catapultTargets?: CatapultTarget[];
  units: UnitSelection[];
};

export type CatapultTargetsConfirmationOption = {
  type: 'catapultTargets';
  targetCount: 1 | 2;
};

const minimumCatapultsForTwoTargets = 20;
const rallyPointLevelForResourceTargets = 5;
const rallyPointLevelForAllTargets = 10;
const rallyPointLevelForTwoTargets = 20;

const resourceCatapultTargetBuildingIds = [
  'WOODCUTTER',
  'CLAY_PIT',
  'IRON_MINE',
  'WHEAT_FIELD',
  'BRICKYARD',
  'IRON_FOUNDRY',
  'SAWMILL',
  'GRAIN_MILL',
  'BAKERY',
] as const satisfies Building['id'][];

const excludedAllCatapultTargetBuildingIds = [
  'CRANNY',
  'TRAPPER',
] as const satisfies Building['id'][];

const hasCatapultsSelected = (units: UnitSelection[]) => {
  return units.some(
    (unit) => unit.selected > 0 && unit.tier === 'siege-catapult',
  );
};

const getSelectedCatapultCount = (units: UnitSelection[]) => {
  let selectedCatapultCount = 0;

  for (const unit of units) {
    if (unit.tier !== 'siege-catapult') {
      continue;
    }

    selectedCatapultCount += unit.selected;
  }

  return selectedCatapultCount;
};

const getRallyPointLevel = (
  buildingFields: { buildingId: Building['id']; level: number }[],
) => {
  return (
    buildingFields.find(({ buildingId }) => buildingId === 'RALLY_POINT')
      ?.level ?? 0
  );
};

const isBuildingAvailableForTribe = (
  building: Building,
  targetTribe: Tribe | undefined,
) => {
  const tribeRequirements = building.buildingRequirements.filter(
    (requirement): requirement is TribeBuildingRequirement =>
      requirement.type === 'tribe',
  );

  if (tribeRequirements.length === 0) {
    return true;
  }

  return tribeRequirements.some(
    (requirement) => requirement.tribe === targetTribe,
  );
};

const getCatapultTargetBuildingIds = (
  rallyPointLevel: number,
  targetTribe: Tribe | undefined,
) => {
  if (rallyPointLevel < rallyPointLevelForResourceTargets) {
    return [];
  }

  if (rallyPointLevel < rallyPointLevelForAllTargets) {
    return [...resourceCatapultTargetBuildingIds];
  }

  const catapultTargetBuildingIds: Building['id'][] = [];

  for (const building of buildings) {
    const isExcluded = excludedAllCatapultTargetBuildingIds.some(
      (buildingId) => buildingId === building.id,
    );

    if (isExcluded || !isBuildingAvailableForTribe(building, targetTribe)) {
      continue;
    }

    catapultTargetBuildingIds.push(building.id);
  }

  return catapultTargetBuildingIds;
};

const getCatapultTargetCount = (
  rallyPointLevel: number,
  units: UnitSelection[],
): 1 | 2 => {
  if (
    rallyPointLevel >= rallyPointLevelForTwoTargets &&
    getSelectedCatapultCount(units) >= minimumCatapultsForTwoTargets
  ) {
    return 2;
  }

  return 1;
};

export const hasRequiredCatapultTargetData = (
  data: Pick<CatapultTargetData, 'catapultTargets'>,
  option: CatapultTargetsConfirmationOption,
) => {
  const catapultTargets = data.catapultTargets?.filter(Boolean) ?? [];

  if (catapultTargets.length < option.targetCount) {
    return false;
  }

  const specificTargetCount = new Set(
    catapultTargets.filter(
      (target): target is Exclude<CatapultTarget, 'random'> =>
        target !== 'random',
    ),
  ).size;
  const selectedSpecificTargetCount = catapultTargets.filter(
    (target) => target !== 'random',
  ).length;

  return specificTargetCount === selectedSpecificTargetCount;
};

export const getDefaultCatapultTargets = (
  data: Pick<CatapultTargetData, 'catapultTargets'>,
  option: CatapultTargetsConfirmationOption,
) => {
  const catapultTargets = data.catapultTargets ?? [];

  return Array.from(
    { length: option.targetCount },
    (_, index) => catapultTargets[index] ?? 'random',
  );
};

export const useCatapultTargets = (targetTribe: Tribe | undefined) => {
  const { currentVillage } = useCurrentVillage();

  const rallyPointLevel = useMemo(() => {
    return getRallyPointLevel(currentVillage.buildingFields);
  }, [currentVillage.buildingFields]);

  const catapultTargetBuildingIds = useMemo(() => {
    return getCatapultTargetBuildingIds(rallyPointLevel, targetTribe);
  }, [rallyPointLevel, targetTribe]);

  const getCatapultConfirmationOption = useCallback(
    (data: CatapultTargetData): CatapultTargetsConfirmationOption | null => {
      if (data.action !== 'attack' || !hasCatapultsSelected(data.units)) {
        return null;
      }

      return {
        type: 'catapultTargets',
        targetCount: getCatapultTargetCount(rallyPointLevel, data.units),
      };
    },
    [rallyPointLevel],
  );

  return {
    catapultTargetBuildingIds,
    getCatapultConfirmationOption,
  };
};
