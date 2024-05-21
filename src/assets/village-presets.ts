import type { BuildingField } from 'interfaces/models/game/village';

export const newVillageBuildingFieldsPreset: BuildingField[] = [
  {
    buildingId: 'MAIN_BUILDING',
    id: 38,
    level: 1,
  },
  {
    buildingId: 'RALLY_POINT',
    id: 39,
    level: 1,
  },
];

export const romanNewVillageBuildingFieldsPreset: BuildingField[] = [
  ...newVillageBuildingFieldsPreset,
  {
    buildingId: 'CITY_WALL',
    id: 40,
    level: 0,
  },
];

export const gaulNewVillageBuildingFieldsPreset: BuildingField[] = [
  ...newVillageBuildingFieldsPreset,
  {
    buildingId: 'PALISADE',
    id: 40,
    level: 0,
  },
];

export const teutonNewVillageBuildingFieldsPreset: BuildingField[] = [
  ...newVillageBuildingFieldsPreset,
  {
    buildingId: 'EARTH_WALL',
    id: 40,
    level: 0,
  },
];

export const hunNewVillageBuildingFieldsPreset: BuildingField[] = [
  ...newVillageBuildingFieldsPreset,
  {
    buildingId: 'MAKESHIFT_WALL',
    id: 40,
    level: 0,
  },
];

export const egyptianNewVillageBuildingFieldsPreset: BuildingField[] = [
  ...newVillageBuildingFieldsPreset,
  {
    buildingId: 'STONE_WALL',
    id: 40,
    level: 0,
  },
];

// TODO: Spartan buildings are missing, add them
// export const spartanNewVillageBuildingFieldsPreset: BuildingField[] = [
//   ...newVillageBuildingFieldsPreset,
//   {
//     buildingId: 'DEFENSIVE_WALL',
//     buildingFieldId: 40,
//     level: 0,
//   },
// ];
