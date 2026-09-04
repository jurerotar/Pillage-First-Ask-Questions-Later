import { describe, expect, test } from 'vitest';
import type { Server } from '@pillage-first/types/models/server';
import { getCreateServerFormDefaultValues } from 'app/(public)/(game-worlds)/(create)/components/create-new-game-world-form';

const gameWorldTemplate: Server = {
  id: 'server-id',
  version: '0.4.62',
  name: 'Template world',
  slug: 's-test',
  createdAt: 0,
  seed: 'shared-seed',
  configuration: {
    mapSize: 200,
    speed: 5,
  },
  playerConfiguration: {
    name: 'Player name',
    tribe: 'huns',
  },
};

describe(getCreateServerFormDefaultValues, () => {
  test('copies the reusable settings from a game world template', () => {
    expect(getCreateServerFormDefaultValues(gameWorldTemplate)).toEqual({
      seed: 'shared-seed',
      name: 'Template world copy',
      configuration: {
        mapSize: '200',
        speed: '5',
      },
      playerConfiguration: {
        name: 'Player name',
        tribe: 'huns',
      },
      gameplay: {
        areOfflineNpcAttacksEnabled: true,
      },
    });
  });
});
