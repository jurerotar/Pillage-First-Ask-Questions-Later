import { serverFactory } from 'app/factories/server-factory';
import type { Server } from 'app/interfaces/models/game/server';

const MOCK_SERVER_SEED = '23223ca711';
const MOCK_SERVER_NAME = 'test server';
const id = crypto.randomUUID();
const slug = `s-${id.substring(0, 4)}`;

const mockServerConfig: Server = {
  id,
  slug,
  name: MOCK_SERVER_NAME,
  seed: MOCK_SERVER_SEED,
  version: '0.0.0',
  createdAt: Date.now(),
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
