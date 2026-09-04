// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Server } from '@pillage-first/types/models/server';
import { ServerCard } from 'app/(public)/(game-worlds)/(index)/components/server-card';

const actionMocks = vi.hoisted(() => ({
  deleteGameWorld: vi.fn(),
  duplicateGameWorld: vi.fn(),
  exportGameWorld: vi.fn(),
  renameGameWorld: vi.fn().mockResolvedValue([]),
  toggleGameWorldPin: vi.fn(),
}));

vi.mock('app/(public)/(game-worlds)/hooks/use-game-world-actions', () => ({
  useGameWorldActions: () => ({
    ...actionMocks,
    isDeleteGameWorldPending: false,
    isDuplicateGameWorldPending: false,
    isExportGameWorldPending: false,
    isPinGameWorldPending: false,
    isRenameGameWorldPending: false,
  }),
}));

vi.mock('app/hooks/use-intl', () => ({
  useIntl: () => ({}),
}));

vi.mock('app/utils/time', () => ({
  daysSince: () => 'today',
}));

const server: Server = {
  id: 'server-id',
  version: '0.4.62',
  name: 'Original name',
  slug: 's-test',
  createdAt: 0,
  seed: 'seed',
  configuration: {
    mapSize: 100,
    speed: 1,
  },
  playerConfiguration: {
    name: 'Player',
    tribe: 'romans',
  },
};

describe(ServerCard, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  test('renames a game world inline', async () => {
    render(
      <MemoryRouter>
        <ServerCard
          server={server}
          isPinned={false}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rename game world' }));

    const input = screen.getByRole('textbox', { name: 'Game world name' });
    expect(screen.queryByRole('heading', { name: 'Original name' })).toBeNull();

    fireEvent.change(input, { target: { value: 'Renamed world' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save game world name' }),
    );

    await waitFor(() => {
      expect(actionMocks.renameGameWorld).toHaveBeenCalledWith({
        server,
        name: 'Renamed world',
      });
    });
  });

  test('offers template creation, seed copying, and pinning actions', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <MemoryRouter>
        <ServerCard
          server={server}
          isPinned={false}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Game world actions' }));

    expect(
      await screen.findByRole('button', {
        name: 'Create from same settings',
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Copy seed' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('seed'));

    fireEvent.click(screen.getByRole('button', { name: 'Game world actions' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Pin game world' }),
    );

    expect(actionMocks.toggleGameWorldPin).toHaveBeenCalledWith({ server });
  });
});
