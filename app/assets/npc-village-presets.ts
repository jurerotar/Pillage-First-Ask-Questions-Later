import {
  lgVillageResourceFieldsPreset,
  mdVillageResourceFieldsPreset,
  smVillageResourceFieldsPreset,
  xsVillageResourceFieldsPreset,
} from 'app/factories/presets/resource-building-fields-presets';
import {
  lgVillageBuildingFieldsPreset,
  mdVillageBuildingFieldsPreset,
  smVillageBuildingFieldsPreset,
  xsVillageBuildingFieldsPreset,
} from 'app/factories/presets/village-building-fields-presets';
import type { BuildingField, VillagePresetId } from 'app/interfaces/models/game/village';

export const presetIdToPresetMap = new Map<VillagePresetId, BuildingField[]>([
  ['resources-xs', xsVillageResourceFieldsPreset],
  ['resources-sm', smVillageResourceFieldsPreset],
  ['resources-md', mdVillageResourceFieldsPreset],
  ['resources-lg', lgVillageResourceFieldsPreset],
  ['village-xs', xsVillageBuildingFieldsPreset],
  ['village-sm', smVillageBuildingFieldsPreset],
  ['village-md', mdVillageBuildingFieldsPreset],
  ['village-lg', lgVillageBuildingFieldsPreset],
]);
