import type { Server } from 'interfaces/models/game/server';
import { serverFactory } from 'app/factories/server-factory';

const MOCK_SERVER_SEED = '23223ca711';
const MOCK_SERVER_NAME = 'test server';

const mockServerConfig: Pick<Server, 'name' | 'seed' | 'configuration' | 'playerConfiguration'> = {
  name: MOCK_SERVER_NAME,
  seed: MOCK_SERVER_SEED,
  playerConfiguration: {
    name: 'test player',
    tribe: 'gauls',
  },
  configuration: {
    mapSize: 100,
    speed: 1,
  },
};

export const serverMock: Server = serverFactory(mockServerConfig);

export const gaulServerMock: Server = {
  ...serverMock,
};

export const teutonServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'teutons',
  },
};

export const romanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'romans',
  },
};

export const egyptianServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'egyptians',
  },
};

export const hunServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'huns',
  },
};

export const spartanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'spartans',
  },
};

export const natarServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'natars',
  },
};
