import { VillageBuildingFieldsPreset } from 'interfaces/models/game/village';

export const villagePresets: VillageBuildingFieldsPreset[] = [
  {
    preset: 'new-village',
    buildingFields: [
      {
        buildingId: 'MAIN_BUILDING',
        buildingFieldId: '1',
        level: 1,
      },
      {
        buildingId: 'RALLY_POINT',
        buildingFieldId: '2',
        level: 1,
      },
    ],
  },
];
