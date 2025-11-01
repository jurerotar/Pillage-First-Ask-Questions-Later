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

export const getBuildingDefinition = (buildingId: Building['id']) => {
  return buildingMap.get(buildingId)!;
};

export const getBuildingDataForLevel = (
  buildingId: Building['id'],
  level: number,
) => {
  const building = getBuildingDefinition(buildingId);

  const population = calculateTotalPopulationForLevel(buildingId, level);
  const culturePoints = calculateTotalCulturePointsForLevel(buildingId, level);

  const nextLevelPopulation = calculateTotalPopulationForLevel(
    buildingId,
    level + 1,
  );
  const nextLevelCulturePoints = calculateTotalCulturePointsForLevel(
    buildingId,
    level + 1,
  );

  const isMaxLevel = building.maxLevel === level;

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
    population,
    culturePoints,
    nextLevelPopulation,
    nextLevelCulturePoints,
    nextLevelResourceCost,
    nextLevelBuildingDuration,
  };
};

export const calculatePopulationDifference = (
  buildingId: Building['id'],
  currentLevel: number,
  nextLevel: number,
): number => {
  const { population: currentPopulation } = getBuildingDataForLevel(
    buildingId,
    currentLevel,
  );
  const { population: nextPopulation } = getBuildingDataForLevel(
    buildingId,
    nextLevel,
  );

  return nextPopulation - currentPopulation;
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
    getBuildingDefinition(buildingId);

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

export const calculateTotalCulturePointsForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const { culturePointsCoefficient } = getBuildingDefinition(buildingId);

  if (level === 0) {
    return 0;
  }

  return Math.round(culturePointsCoefficient * 1.2 ** level);
};

export const calculateTotalPopulationForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const { populationCoefficient } = getBuildingDefinition(buildingId);

  if (level <= 0) {
    return 0;
  }

  if (level === 1) {
    return populationCoefficient;
  }

  const C = 5 * populationCoefficient + 4;
  const q = Math.trunc(C / 10);
  const r = C - q * 10;

  const n1 = r + level;
  const K1 = Math.trunc(n1 / 10);
  const rem1 = n1 - K1 * 10;
  const F1 = 5 * K1 * K1 - 4 * K1 + K1 * rem1;

  const n0 = r + 1;
  const K0 = Math.trunc(n0 / 10);
  const rem0 = n0 - K0 * 10;
  const F0 = 5 * K0 * K0 - 4 * K0 + K0 * rem0;

  const S = F1 - F0;

  return populationCoefficient + (level - 1) * q + S;
};

// export const calculatePopulationDifferenceForLevel = (
//   buildingId: Building['id'],
//   level: number
// ): number => {
//   const { populationCoefficient } = getBuildingData(buildingId);
//
//   if (level === 1) {
//     return populationCoefficient;
//   }
//
//   return Math.round((5 * populationCoefficient + level - 1) / 10);
// };

export const calculateBuildingDurationForLevel = (
  buildingId: Building['id'],
  level: number,
): number => {
  const {
    buildingDurationBase,
    buildingDurationModifier,
    buildingDurationReduction,
  } = getBuildingDefinition(buildingId);

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
