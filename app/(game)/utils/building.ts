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
  const currentLevelResourceCost = calculateBuildingCostForLevel(buildingId, level);
  const nextLevelResourceCost = isMaxLevel ? [0, 0, 0, 0] : calculateBuildingCostForLevel(buildingId, level + 1);
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

export const calculateBuildingCostForLevel = (buildingId: Building['id'], level: number): number[] => {
  const { buildingCostCoefficient, baseBuildingCost } = getBuildingData(buildingId);

  return baseBuildingCost.map((resource) => Math.ceil((resource * buildingCostCoefficient ** level) / 5) * 5);
};

// function RoundMul(v, n) {
//   return Math.round(v / n) * n;
// }
// function TimeT3(a, k, b) {
//   this.a = a;
//   if (arguments.length < 3) {
//     this.k = 1.16;
//     if (arguments.length === 1) { k = 1; }
//     this.b = 1875 * k;
//   } else {
//     this.k = k;
//     this.b = b;
//   }
// }
// TimeT3.prototype.valueOf = function (lvl) {
//   return this.a * Math.pow(this.k, lvl-1) - this.b;
// };
// function TimeT5 () {}
// TimeT5.prototype.valueOf = function (lvl) { return this.b * this.mul[lvl-1] + this.e; };
// // resource fields
// function TimeT5a(b) { this.b = b; this.e = 0; }
// TimeT5a.prototype = new TimeT5();
// TimeT5a.prototype.mul = [1, 4.5, 15, 60, 120, 240, 360, 720, 1080, 1620, 2160, 2700, 3240, 3960, 4500, 5400, 7200, 9000, 10800, 14400];
// // most buildings
// function TimeT5b(b, e) { this.b = b; this.e = e || 0; }
// TimeT5b.prototype = new TimeT5();
// TimeT5b.prototype.mul = [3, 22.5, 48, 90, 210, 480, 720, 990, 1200, 1380, 1680, 1980, 2340, 2640, 3060, 3420, 3960, 4680, 5400, 6120];
// // factories
// function TimeT5c(e) { this.b = 60; this.e = e * 60 || 0; }
// TimeT5c.prototype = new TimeT5();
// TimeT5c.prototype.mul = [8, 25, 55, 140, 240];
// // wonder of the world
// function TimeT5w() { this.b = 300; this.e = 0; }
// TimeT5w.prototype = new TimeT5();
// TimeT5w.prototype.mul = [12,16,20,24,28,32,36,40,44,46,46,47,48,48,49,50,51,51,52,53,54,55,57,58,59,60,62,63,64,66,67,69,70,72,74,75,77,79,81,83,85,87,89,91,93,96,98,100,103,105,107,110,113,115,118,121,123,126,129,132,135,138,141,144,147,150,154,157,160,164,167,171,174,178,181,185,189,193,196,200,204,208,212,216,220,225,229,233,237,242,246,251,255,260,264,269,274,278,288,576];
