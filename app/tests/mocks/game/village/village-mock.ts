import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerMock } from '../player-mock';
import { newVillageBuildingFieldsMock } from './building-fields-mock';
import { resourceFields4446Mock } from './resource-fields-mock';

const { id: playerId } = playerMock;

export const villageMock: PlayerVillage = {
  id: 0,
  name: 'player',
  slug: 'v-1',
  buildingFields: [...resourceFields4446Mock, ...newVillageBuildingFieldsMock],
  buildingFieldsPresets: [],
  RFC: '4446',
  playerId,
  isCapital: true,
  lastUpdatedAt: Date.now(),
  expansionSlots: [],
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750,
  },
  artifactId: null,
};
