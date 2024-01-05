import { VillageBuildingFieldsPreset } from 'interfaces/models/game/village';

export const villagePresets: VillageBuildingFieldsPreset[] = [
  {
    preset: 'new-village',
    buildingFields: [
      {
        buildingId: 'MAIN_BUILDING',
        buildingFieldId: 38,
        level: 1,
      },
      {
        buildingId: 'RALLY_POINT',
        buildingFieldId: 39,
        level: 1,
      },
    ],
  },
];
