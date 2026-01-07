import type { Server } from '@pillage-first/types/models/server';

const MOCK_SERVER_SEED = '23223ca711';
const MOCK_SERVER_NAME = 'test server';
const id = globalThis.crypto.randomUUID();
const slug = `s-${id.slice(0, 4)}`;

export const serverMock: Server = {
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
