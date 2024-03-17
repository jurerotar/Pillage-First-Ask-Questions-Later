import { BuildingField } from 'interfaces/models/game/village';

export const newVillageBuildingFieldsMock: BuildingField[] = [
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

export const villageWithAcademyBuildingFieldsMock: BuildingField[] = [
  {
    buildingId: 'MAIN_BUILDING',
    id: 38,
    level: 3,
  },
  {
    buildingId: 'RALLY_POINT',
    id: 39,
    level: 1,
  },
  {
    buildingId: 'BARRACKS',
    id: 37,
    level: 3,
  },
  {
    buildingId: 'ACADEMY',
    id: 36,
    level: 1,
  },
];

export const villageWithBarracksRequirementsMetBuildingFieldsMock: BuildingField[] = [
  {
    buildingId: 'MAIN_BUILDING',
    id: 38,
    level: 3,
  },
  {
    buildingId: 'RALLY_POINT',
    id: 39,
    level: 1,
  },
];

export const villageWithTownHallRequirementsMetBuildingFieldsMock: BuildingField[] = [
  {
    buildingId: 'MAIN_BUILDING',
    id: 38,
    level: 10,
  },
  {
    buildingId: 'RALLY_POINT',
    id: 39,
    level: 1,
  },
  {
    buildingId: 'BARRACKS',
    id: 37,
    level: 3,
  },
  {
    buildingId: 'ACADEMY',
    id: 36,
    level: 10,
  },
];
