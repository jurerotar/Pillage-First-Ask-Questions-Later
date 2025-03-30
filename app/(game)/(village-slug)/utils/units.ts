import type { Unit } from 'app/interfaces/models/game/unit';
import { unitsMap } from 'app/(game)/(village-slug)/assets/units';
import type { Resource, Resources } from 'app/interfaces/models/game/resource';

export const getUnitData = (unitId: Unit['id']): Unit => {
  return unitsMap.get(unitId)!;
};

export const calculateMaxUnits = (resources: Resources, costs: number[]): number => {
  const resourceKeys: Resource[] = ['wood', 'clay', 'iron', 'wheat'];

  const maxUnitsPerResource = resourceKeys.map((resource, index) =>
    costs[index] > 0 ? Math.floor(resources[resource] / costs[index]) : Number.POSITIVE_INFINITY,
  );

  return Math.min(...maxUnitsPerResource);
};

export const calculateUnitUpgradeCostForLevel = (unitId: Unit['id'], level: number): number[] => {
  const { baseRecruitmentCost } = getUnitData(unitId);

  const unitUpgradeCostModifier = 1.35;

  return baseRecruitmentCost.map((resource) => Math.ceil((5 * resource * unitUpgradeCostModifier ** (level - 1)) / 5) * 5);
};

export const calculateUnitUpgradeDurationForLevel = (unitId: Unit['id'], level: number): number => {
  const { baseRecruitmentDuration } = getUnitData(unitId);

  const unitUpgradeDurationModifier = 1.35;

  return Math.ceil((baseRecruitmentDuration * unitUpgradeDurationModifier ** (level - 1)) / 5) * 5 * 1000;
};

export const calculateUnitResearchCost = (unitId: Unit['id']): number[] => {
  const { baseRecruitmentCost, category, tier } = getUnitData(unitId);

  const unitResearchCostModifier = (() => {
    if (tier === 'scout' || category === 'infantry') {
      return 10;
    }

    if (category === 'cavalry') {
      return 7;
    }

    if (category === 'siege') {
      return 5;
    }

    return 1.5;
  })();

  return baseRecruitmentCost.map((resource) => Math.ceil((resource * unitResearchCostModifier) / 5) * 5);
};

export const calculateUnitResearchDuration = (unitId: Unit['id']): number => {
  const { baseRecruitmentDuration, tier, category } = getUnitData(unitId);

  const unitResearchDurationModifier = (() => {
    if (tier === 'scout' || category === 'infantry') {
      return 8;
    }

    if (category === 'cavalry') {
      return 5;
    }

    if (category === 'siege') {
      return 3;
    }

    return 2;
  })();

  return Math.ceil((baseRecruitmentDuration * unitResearchDurationModifier) / 5) * 5 * 1000;
};
