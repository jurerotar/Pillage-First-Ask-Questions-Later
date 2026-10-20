import { afterEach, expect, test, vi } from 'vitest';
import {
  downloadSharedWorld,
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
  const onProgress = vi.fn();

  await expect(uploadSharedWorld(pending, onProgress)).rejects.toThrow(
    'Network unavailable',
  );
  expect(pending.nextChunkIndex).toBe(1);

  await expect(uploadSharedWorld(pending, onProgress)).resolves.toBe('world');
  expect(onProgress.mock.calls.map(([progress]) => progress.loaded)).toEqual([
    0, 2, 2, 4,
  ]);
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

test.each([true, false])(
  'reports streamed download progress with a known total: %s',
  async (hasTotal) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4, 5]));
        controller.close();
      },
    });
    const fetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: hasTotal ? { 'content-length': '5' } : {},
      }),
    );
    const onProgress = vi.fn();

    vi.stubGlobal('fetch', fetch);

    const buffer = await downloadSharedWorld(
      'shared-world',
      'download-token',
      onProgress,
    );

    expect([...new Uint8Array(buffer)]).toEqual([1, 2, 3, 4, 5]);
    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([
      { loaded: 0, total: hasTotal ? 5 : null },
      { loaded: 2, total: hasTotal ? 5 : null },
      { loaded: 5, total: hasTotal ? 5 : null },
    ]);
  },
);

test('propagates a failed download stream instead of importing partial bytes', async () => {
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.error(new Error('Download interrupted'));
    },
  });

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)));

  await expect(
    downloadSharedWorld('shared-world', 'download-token', vi.fn()),
  ).rejects.toThrow('Download interrupted');
});
