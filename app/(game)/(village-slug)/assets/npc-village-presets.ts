import {
  lgVillageResourceFieldsPreset,
  mdVillageResourceFieldsPreset,
  smVillageResourceFieldsPreset,
  xlVillageResourceFieldsPreset,
  xsVillageResourceFieldsPreset,
  xxlVillageResourceFieldsPreset,
  xxsVillageResourceFieldsPreset,
  xxxlVillageResourceFieldsPreset,
  xxxxlVillageResourceFieldsPreset,
} from 'app/factories/presets/resource-building-fields-presets';
import {
  lgVillageBuildingFieldsPreset,
  mdVillageBuildingFieldsPreset,
  smVillageBuildingFieldsPreset,
  xlVillageBuildingFieldsPreset,
  xsVillageBuildingFieldsPreset,
  xxlVillageBuildingFieldsPreset,
  xxsVillageBuildingFieldsPreset,
  xxxlVillageBuildingFieldsPreset,
  xxxxlVillageBuildingFieldsPreset,
} from 'app/factories/presets/village-building-fields-presets';
import type {
  BuildingField,
  VillagePresetId,
} from 'app/interfaces/models/game/village';

export const presetIdToPresetMap = new Map<VillagePresetId, BuildingField[]>([
  ['resources-xxs', xxsVillageResourceFieldsPreset],
  ['resources-xs', xsVillageResourceFieldsPreset],
  ['resources-sm', smVillageResourceFieldsPreset],
  ['resources-md', mdVillageResourceFieldsPreset],
  ['resources-lg', lgVillageResourceFieldsPreset],
  ['resources-xl', xlVillageResourceFieldsPreset],
  ['resources-2xl', xxlVillageResourceFieldsPreset],
  ['resources-3xl', xxxlVillageResourceFieldsPreset],
  ['resources-4xl', xxxxlVillageResourceFieldsPreset],
  ['village-xxs', xxsVillageBuildingFieldsPreset],
  ['village-xxs', xsVillageBuildingFieldsPreset],
  ['village-xs', xsVillageBuildingFieldsPreset],
  ['village-sm', smVillageBuildingFieldsPreset],
  ['village-md', mdVillageBuildingFieldsPreset],
  ['village-lg', lgVillageBuildingFieldsPreset],
  ['village-xl', xlVillageBuildingFieldsPreset],
  ['village-2xl', xxlVillageBuildingFieldsPreset],
  ['village-3xl', xxxlVillageBuildingFieldsPreset],
  ['village-4xl', xxxxlVillageBuildingFieldsPreset],
]);
