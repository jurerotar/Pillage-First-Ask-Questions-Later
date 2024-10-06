import type { Village } from 'app/interfaces/models/game/village';
import { playerMock } from '../player-mock';
import { newVillageBuildingFieldsMock } from './building-fields-mock';
import { resourceFields4446Mock } from './resource-fields-mock';

const { id: playerId } = playerMock;

export const villageMock: Village = {
  id: '0-0',
  name: 'player',
  slug: 'v-1',
  coordinates: {
    x: 0,
    y: 0,
  },
  buildingFields: [...resourceFields4446Mock, ...newVillageBuildingFieldsMock],
  buildingFieldsPresets: [],
  resourceFieldComposition: '4446',
  playerId,
  isCapital: true,
  wheatUpkeep: 3,
  lastUpdatedAt: Date.now(),
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750,
  },
};
