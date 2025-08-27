import type { BuildingField } from 'app/interfaces/models/game/building-field';

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

export const villageWithBarracksRequirementsMetBuildingFieldsMock: BuildingField[] =
  [
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

export const villageWithWorkshopRequirementsMetBuildingFieldsMock: BuildingField[] =
  [
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
