import type { Village } from '@pillage-first/types/models/village';
import { newVillageBuildingFieldsMock } from './building-fields-mock';
import { playerMock } from './player-mock';
import { resourceFields4446Mock } from './resource-fields-mock';

const { id: playerId } = playerMock;

export const villageMock: Village = {
  id: 0,
  tileId: 0,
  coordinates: {
    x: 0,
    y: 0,
  },
  name: 'player',
  slug: 'v-1',
  buildingFields: [...resourceFields4446Mock, ...newVillageBuildingFieldsMock],
  resourceFieldComposition: '4446',
  playerId,
  lastUpdatedAt: Date.now(),
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750,
  },
};
