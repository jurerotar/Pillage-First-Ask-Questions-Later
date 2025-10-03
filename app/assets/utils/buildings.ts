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

    const population = calculateTotalPopulationForLevel(buildingId, level);
    sum += population;
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
  const q = Math.floor(C / 10);
  const r = C % 10; // 0..9

  const F = (n: number) => {
    const K = Math.floor(n / 10);
    const rem = n - 10 * K;
    return 5 * K * (K - 1) + K * (rem + 1);
  };

  const S = F(r + level) - F(r + 1);

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
