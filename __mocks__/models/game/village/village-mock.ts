import { Village } from 'interfaces/models/game/village';
import { serverMock } from 'mocks/models/game/server-mock';
import { playerMock } from 'mocks/models/game/player-mock';
import { resourceFields4446Mock } from './resource-fields-mock';
import { newVillageBuildingFieldsMock } from './building-fields-mock';

const { id: serverId } = serverMock;
const { id: playerId } = playerMock;

export const villageMock: Village = {
  serverId,
  id: '9ab89c67-8903-4d63-b67a-8b8cbe6597de',
  name: 'player-950bbc85d18046cbc1a87cd58ca03e24f2b0f72e',
  slug: 'v-1',
  coordinates: {
    x: 0,
    y: 0,
  },
  buildingFields: [
    ...resourceFields4446Mock,
    ...newVillageBuildingFieldsMock
  ],
  playerId,
  isCapital: true,
  lastUpdatedAt: 1703165323113,
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750,
  },
};
