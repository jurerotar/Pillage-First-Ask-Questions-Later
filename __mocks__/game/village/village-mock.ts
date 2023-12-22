// import { Village } from 'interfaces/models/game/village';
// import { newVillageBuildingFieldsMock } from 'mocks/game/village/building-fields-mock';
// import { resourceFields4446Mock } from 'mocks/game/village/resource-fields-mock';
//
// export const new4446VillageMock: Village = {
//   buildingFields: newVillageBuildingFieldsMock,
//   resourceFields: resourceFields4446Mock
// };

import { Village } from 'interfaces/models/game/village';
import { serverMock } from 'mocks/models/game/server-mock';
import { playerMock } from 'mocks/models/game/player-mock';

const { id: serverId } = serverMock;
const { id: playerId } = playerMock;

export const villageMock: Village = {
  serverId,
  id: '9ab89c67-8903-4d63-b67a-8b8cbe6597de',
  name: 'player-950bbc85d18046cbc1a87cd58ca03e24f2b0f72e',
  slug: 'v-1',
  coordinates: {
    x: 0,
    y: 0
  },
  resourceFields: [
    {
      resourceFieldId: '1',
      type: 'wood',
      level: 0
    },
    {
      resourceFieldId: '2',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '3',
      type: 'wood',
      level: 0
    },
    {
      resourceFieldId: '4',
      type: 'iron',
      level: 0
    },
    {
      resourceFieldId: '5',
      type: 'clay',
      level: 0
    },
    {
      resourceFieldId: '6',
      type: 'clay',
      level: 0
    },
    {
      resourceFieldId: '7',
      type: 'iron',
      level: 0
    },
    {
      resourceFieldId: '8',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '9',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '10',
      type: 'iron',
      level: 0
    },
    {
      resourceFieldId: '11',
      type: 'iron',
      level: 0
    },
    {
      resourceFieldId: '12',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '13',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '14',
      type: 'wood',
      level: 0
    },
    {
      resourceFieldId: '15',
      type: 'wheat',
      level: 0
    },
    {
      resourceFieldId: '16',
      type: 'clay',
      level: 0
    },
    {
      resourceFieldId: '17',
      type: 'wood',
      level: 0
    },
    {
      resourceFieldId: '18',
      type: 'clay',
      level: 0
    }
  ],
  buildingFields: [
    {
      buildingId: 'MAIN_BUILDING',
      buildingFieldId: '1',
      level: 1
    },
    {
      buildingId: 'RALLY_POINT',
      buildingFieldId: '2',
      level: 1
    }
  ],
  playerId,
  isCapital: false,
  lastUpdatedAt: 1703165323113,
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750
  }
};
