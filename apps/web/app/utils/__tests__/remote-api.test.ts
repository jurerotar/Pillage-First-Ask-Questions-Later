import { afterEach, expect, test, vi } from 'vitest';
import {
  type PendingWorldShare,
  uploadSharedWorld,
} from 'app/utils/remote-api';

vi.mock('@pillage-first/utils/env', () => ({
  env: { VITE_API_URL: 'https://api.example.test' },
}));

afterEach(() => vi.unstubAllGlobals());

test('renews expired signed URLs and resumes uploads after a failed chunk', async () => {
  const reservation = {
    worldId: 'world',
    writeToken: 'secret',
    chunkSize: 2,
    chunkUrlTemplate: 'https://api.example.test/old/{chunkIndex}',
    completeUrl: 'https://api.example.test/old/complete',
  };
  const refreshed = {
    ...reservation,
    chunkUrlTemplate: 'https://api.example.test/new/{chunkIndex}',
    completeUrl: 'https://api.example.test/new/complete',
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(reservation))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(refreshed))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ status: 'complete' }));

  vi.stubGlobal('fetch', fetch);

  const pending: PendingWorldShare = {
    world: new Blob(['abcd']),
    filename: 'world.sqlite3',
    nextChunkIndex: 0,
  };

  await expect(uploadSharedWorld(pending)).rejects.toThrow(
    'Network unavailable',
  );
  expect(pending.nextChunkIndex).toBe(1);

  await expect(uploadSharedWorld(pending)).resolves.toBe('world');
  expect(fetch.mock.calls.map((call) => String(call[0]))).toEqual([
    'https://api.example.test/api/game-worlds',
    'https://api.example.test/old/0',
    'https://api.example.test/api/game-worlds/world/upload-url',
    'https://api.example.test/new/0',
    'https://api.example.test/new/1',
    'https://api.example.test/new/1',
    'https://api.example.test/new/complete',
  ]);
});
