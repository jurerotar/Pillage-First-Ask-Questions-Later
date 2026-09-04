import { describe, expect, test } from 'vitest';
import type { Server } from '@pillage-first/types/models/server';
import { sortGameWorldsByPinned } from 'app/(public)/(game-worlds)/utils/game-world-listing';

const createServer = (id: string): Server => ({
  id,
  version: '0.4.62',
  name: `Server ${id}`,
  slug: `s-${id}`,
  createdAt: 0,
  seed: id,
  configuration: {
    mapSize: 100,
    speed: 1,
  },
  playerConfiguration: {
    name: 'Player',
    tribe: 'romans',
  },
});

describe(sortGameWorldsByPinned, () => {
  test('moves pinned worlds first and preserves the order within each group', () => {
    const servers = [createServer('a'), createServer('b'), createServer('c')];

    expect(sortGameWorldsByPinned(servers, ['c'])).toEqual([
      servers[2],
      servers[0],
      servers[1],
    ]);
    expect(servers.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });
});
