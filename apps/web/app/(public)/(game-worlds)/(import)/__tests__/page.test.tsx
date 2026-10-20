// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import ImportGameWorld from 'app/(public)/(game-worlds)/(import)/page';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  worker: vi.fn(),
  create: vi.fn(),
}));

vi.mock('app/utils/remote-api', () => ({ remoteRequest: mocks.request }));
vi.mock('app/utils/workers', () => ({ workerFactory: mocks.worker }));
vi.mock('app/(public)/(game-worlds)/hooks/use-game-world-actions', () => ({
  useGameWorldActions: () => ({ createGameWorld: mocks.create }),
}));
vi.mock('app/instrumentation/product-events', () => ({
  pushGameWorldImported: vi.fn(),
}));
vi.mock('app/utils/react-query', () => ({ invalidateQueries: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const renderImport = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <MemoryRouter
        initialEntries={['/game-worlds/import?world-id=shared-world']}
      >
        <Routes>
          <Route
            path="/game-worlds/import"
            element={<ImportGameWorld />}
          />
          <Route
            path="/game/:slug/v-1/resources"
            element={<p>World ready</p>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

test('waits for confirmation and deletes the remote world only after import and local registration', async () => {
  const events: string[] = [];

  mocks.request.mockImplementation(async (_path: string, init: RequestInit) => {
    events.push(init.method!);

    return new Response(new Uint8Array([1, 2, 3]));
  });
  mocks.worker.mockImplementation(async () => {
    events.push('import');

    return { resolved: true, server: { slug: 'local-world' } };
  });
  mocks.create.mockImplementation(async () => {
    events.push('register');
  });

  renderImport();

  expect(mocks.request).not.toHaveBeenCalled();

  fireEvent.click(
    screen.getByRole('button', { name: 'Download and import game world' }),
  );
  await screen.findByText('World ready');

  expect(events).toEqual(['POST', 'import', 'register', 'DELETE']);
  expect(mocks.request.mock.calls[0][1].headers).toEqual(
    mocks.request.mock.calls[1][1].headers,
  );
});

test('failed imports preserve the remote copy', async () => {
  mocks.request.mockResolvedValue(new Response(new Uint8Array([1])));
  mocks.worker.mockResolvedValue({
    resolved: false,
    error: 'Incompatible world',
  });

  renderImport();

  fireEvent.click(
    screen.getByRole('button', { name: 'Download and import game world' }),
  );
  await screen.findByText('Error: Incompatible world');

  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.request).toHaveBeenCalledTimes(1);
});

test('retries remote deletion without downloading, importing, or registering twice', async () => {
  mocks.request
    .mockResolvedValueOnce(new Response(new Uint8Array([1])))
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  mocks.worker.mockResolvedValue({
    resolved: true,
    server: { slug: 'local-world' },
  });

  renderImport();

  fireEvent.click(
    screen.getByRole('button', { name: 'Download and import game world' }),
  );
  await screen.findByText(/uploaded copy could not be deleted/);

  fireEvent.click(screen.getByRole('button', { name: 'Finish sharing' }));
  await screen.findByText('World ready');

  expect(mocks.worker).toHaveBeenCalledTimes(1);
  expect(mocks.create).toHaveBeenCalledTimes(1);

  await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(3));

  expect(mocks.request.mock.calls.map((call) => call[1].method)).toEqual([
    'POST',
    'DELETE',
    'DELETE',
  ]);
});
