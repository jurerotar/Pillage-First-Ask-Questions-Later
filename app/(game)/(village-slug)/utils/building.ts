import { buildingMap } from 'app/assets/buildings';
import type {
  Building,
  BuildingEffect,
} from 'app/interfaces/models/game/building';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

// Some fields are special and cannot be destroyed, because they must exist on a specific field: all resource fields, rally point & wall.
export const specialFieldIds: BuildingField['id'][] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 39, 40,
];

export const getBuildingData = (buildingId: Building['id']) => {
  return buildingMap.get(buildingId)!;
};

export const getBuildingDataForLevel = (
  buildingId: Building['id'],
  level: number,
) => {
  const building = getBuildingData(buildingId);
  const wheatConsumptionPerLevel = building.effects[0]!.valuesPerLevel;
  const isMaxLevel = building.maxLevel === level;
  const nextLevelWheatConsumption = Math.abs(
    wheatConsumptionPerLevel[level + 1],
  );
  const nextLevelResourceCost = calculateBuildingCostForLevel(
    buildingId,
    level + 1,
  );
  const nextLevelBuildingDuration = calculateBuildingDurationForLevel(
    buildingId,
    level + 1,
  );

  return {
    building,
    isMaxLevel,
    nextLevelWheatConsumption,
    nextLevelResourceCost,
    nextLevelBuildingDuration,
  };
};

export const getBuildingFieldByBuildingFieldId = (
  currentVillage: Village,
  buildingFieldId: BuildingField['id'],
): BuildingField | null => {
  return (
    currentVillage.buildingFields.find(
      ({ id: fieldId }) => buildingFieldId === fieldId,
    ) ?? null
  );
};

export const calculatePopulationFromBuildingFields = (
  buildingFields: BuildingField[],
): number => {
  let sum = 0;

  for (const { buildingId, level } of buildingFields) {
    if (buildingId === null) {
      continue;
    }

    const fullBuildingData: Building = getBuildingData(buildingId)!;
    const wheatConsumptionPerLevel =
      fullBuildingData.effects[0]!.valuesPerLevel;
    sum += wheatConsumptionPerLevel[level];
  }

  return Math.abs(sum);
};

export type CalculatedCumulativeEffect = {
  effectId: Effect['id'];
  currentLevelValue: number;
  nextLevelValue: number;
  areEffectValuesRising: boolean;
  type: BuildingEffect['type'];
};

export const calculateBuildingEffectValues = (
  building: Building,
  level: number,
): CalculatedCumulativeEffect[] => {
  const result: CalculatedCumulativeEffect[] = [];

  for (const effect of building.effects) {
    const { effectId, valuesPerLevel } = effect;

    const currentLevelValue = valuesPerLevel[level];

    const areEffectValuesRising =
      valuesPerLevel.at(1)! < valuesPerLevel.at(-1)!;

    const nextLevelValue =
      level + 1 < valuesPerLevel.length ? valuesPerLevel[level + 1] : 0;

    result.push({
      effectId,
      currentLevelValue,
      nextLevelValue,
      areEffectValuesRising,
      type: effect.type,
    });
  }

  return result;
};

export const calculateBuildingCostForLevel = (
  buildingId: Building['id'],
  level: number,
): number[] => {
  const { buildingCostCoefficient, baseBuildingCost } =
    getBuildingData(buildingId);

  return baseBuildingCost.map(
    (resource) =>
      Math.ceil((resource * buildingCostCoefficient ** (level - 1)) / 5) * 5,
  );
};

export const calculateBuildingCancellationRefundForLevel = (
  buildingId: Building['id'],
  level: number,
): number[] => {
  const buildingCost = calculateBuildingCostForLevel(buildingId, level);

  return buildingCost.map((cost) => Math.trunc(cost * 0.8));
};

export const calculateBuildingDurationForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const {
    buildingDurationBase,
    buildingDurationModifier,
    buildingDurationReduction,
  } = getBuildingData(buildingId);

  return (
    Math.ceil(
      (buildingDurationModifier * buildingDurationBase ** (level - 1) -
        buildingDurationReduction) /
        5,
    ) *
    5 *
    1000
  );
};
