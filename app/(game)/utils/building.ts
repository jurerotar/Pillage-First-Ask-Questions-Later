import { buildingMap } from 'app/assets/buildings';
import { presetIdToPresetMap } from 'app/assets/npc-village-presets';
import type { Building } from 'app/interfaces/models/game/building';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';
import { partialArraySum } from 'app/utils/common';

const mergeBuildingFields = (buildingFieldsFromPreset: BuildingField[], buildingFields: BuildingField[]): BuildingField[] => {
  // Create a map from the second array using the 'id' as the key
  const map = new Map(buildingFields.map((field) => [field.id, field]));

  // Iterate over the first array and add its fields to the map only if not already present
  for (const field of buildingFieldsFromPreset) {
    if (!map.has(field.id)) {
      map.set(field.id, field);
    }
  }

  // Return the combined result as an array
  return Array.from(map.values());
};

// Some fields are special and cannot be destroyed, because they must exist on a specific field: all resource fields, rally point & wall.
export const specialFieldIds: BuildingField['id'][] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 39, 40];

export const getBuildingData = (buildingId: Building['id']) => {
  return buildingMap.get(buildingId)!;
};

const getBuildingFieldPresetData = (buildingFieldsPresets: Village['buildingFieldsPresets']): BuildingField[] => {
  return buildingFieldsPresets.flatMap((presetId) => presetIdToPresetMap.get(presetId)!);
};

export const getBuildingDataForLevel = (buildingId: Building['id'], level: number) => {
  const building = getBuildingData(buildingId);
  const isMaxLevel = building.cropConsumption.length === level;
  const cumulativeCropConsumption = partialArraySum(building.cropConsumption, level);
  const nextLevelCropConsumption = building.cropConsumption[level] ?? 0;
  const currentLevelResourceCost = building.buildingCost[level - 1] ?? [0, 0, 0, 0];
  const nextLevelResourceCost = building.buildingCost[level] ?? [0, 0, 0, 0];
  const currentLevelBuildingDuration = building.buildingDuration[level - 1] ?? 0;
  const nextLevelBuildingDuration = building.buildingDuration[level] ?? 0;
  const cumulativeEffects = calculateCumulativeEffects(building, level);

  return {
    building,
    isMaxLevel,
    cumulativeCropConsumption,
    nextLevelCropConsumption,
    currentLevelResourceCost,
    nextLevelResourceCost,
    currentLevelBuildingDuration,
    nextLevelBuildingDuration,
    cumulativeEffects,
  };
};

export const getBuildingFieldByBuildingFieldId = (currentVillage: Village, buildingFieldId: BuildingField['id']): BuildingField | null => {
  return currentVillage.buildingFields.find(({ id: fieldId }) => buildingFieldId === fieldId) ?? null;
};

export const calculatePopulationFromBuildingFields = (
  buildingFields: BuildingField[],
  buildingFieldsPresets: Village['buildingFieldsPresets'],
): number => {
  const presetsFields = getBuildingFieldPresetData(buildingFieldsPresets);
  const mergedBuildingFields = mergeBuildingFields(presetsFields, buildingFields);

  let sum = 0;

  for (const { buildingId, level } of mergedBuildingFields) {
    if (buildingId === null) {
      continue;
    }

    const fullBuildingData: Building = getBuildingData(buildingId)!;
    sum += partialArraySum(fullBuildingData.cropConsumption, level);
  }

  return sum;
};

const getResourceProductionByResourceField = (resourceField: BuildingField): number => {
  const { buildingId, level } = resourceField;
  const fullBuildingData: Building = getBuildingData(buildingId)!;
  // There's only 1 effect on production buildings, this should be fine
  const resourceProduction = fullBuildingData.effects[0]!.valuesPerLevel;
  return resourceProduction[level];
};

export const calculateResourceProductionFromResourceFields = (resourceFields: BuildingField[]) => {
  const [woodProduction, clayProduction, ironProduction, wheatProduction] = [
    resourceFields.filter(({ buildingId }) => buildingId === 'WOODCUTTER'),
    resourceFields.filter(({ buildingId }) => buildingId === 'CLAY_PIT'),
    resourceFields.filter(({ buildingId }) => buildingId === 'IRON_MINE'),
    resourceFields.filter(({ buildingId }) => buildingId === 'CROPLAND'),
  ].map((resourceFieldsByResourceType: BuildingField[]) => {
    return resourceFieldsByResourceType.reduce((acc, current) => acc + getResourceProductionByResourceField(current), 0);
  });

  return {
    woodProduction,
    clayProduction,
    ironProduction,
    wheatProduction,
  };
};

type CalculatedCumulativeEffect = {
  effectId: Effect['id'];
  cumulativeValue: number;
  nextLevelValue: number;
  areEffectValuesRising: boolean;
};

const calculateCumulativeEffects = (building: Building, level: number): CalculatedCumulativeEffect[] => {
  const result: CalculatedCumulativeEffect[] = [];

  // Loop through each effect in the building
  for (const effect of building.effects) {
    const { effectId, valuesPerLevel } = effect;

    let cumulativeValue = 0;

    // Calculate cumulative value up to the current level
    for (let i = 0; i <= level; i++) {
      if (Number.isInteger(valuesPerLevel[i])) {
        cumulativeValue += valuesPerLevel[i];
      } else {
        cumulativeValue = valuesPerLevel[i];
      }
    }

    const areEffectValuesRising = valuesPerLevel.at(1)! < valuesPerLevel.at(-1)!;

    const nextLevelValue = level + 1 < valuesPerLevel.length ? valuesPerLevel[level + 1] : 0;

    result.push({
      effectId,
      cumulativeValue,
      nextLevelValue,
      areEffectValuesRising,
    });
  }

  return result;
};
