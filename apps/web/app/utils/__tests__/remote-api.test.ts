import { afterEach, expect, test, vi } from 'vitest';
import {
  downloadSharedWorld,
  type PendingWorldShare,
  uploadSharedWorld,
} from 'app/utils/remote-api';

vi.mock('@pillage-first/utils/env', () => ({
  env: { VITE_API_URL: 'https://api.example.test' },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

const mockChunkUploads = (
  responses: { status: number; error?: boolean; progress?: number[] }[],
) => {
  const requests: { url: string; headers: Map<string, string>; body: Blob }[] =
    [];

  class MockXMLHttpRequest {
    public status = 0;
    public statusText = '';
    public responseText = '';
    public url = '';
    public headers = new Map<string, string>();
    public upload = {
      onprogress: null as ((event: { loaded: number }) => void) | null,
    };
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;

    public open(_method: string, url: string) {
      this.url = url;
    }

    public setRequestHeader(name: string, value: string) {
      this.headers.set(name, value);
    }

    public send(body: Blob) {
      const response = responses.shift();

      if (!response) {
        throw new Error('Unexpected chunk upload');
      }

      requests.push({ url: this.url, headers: this.headers, body });

      queueMicrotask(() => {
        for (const loaded of response.progress ?? [Math.ceil(body.size / 2)]) {
          this.upload.onprogress?.({ loaded });
        }

        if (response.error) {
          this.onerror?.();

          return;
        }

        this.status = response.status;
        this.onload?.();
      });
    }
  }

  vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);

  return requests;
};

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
    .mockResolvedValueOnce(Response.json(refreshed))
    .mockResolvedValueOnce(Response.json({ status: 'complete' }));
  const uploads = mockChunkUploads([
    { status: 401 },
    { status: 204 },
    { status: 0, error: true },
    { status: 204 },
  ]);

  vi.stubGlobal('fetch', fetch);

  const pending: PendingWorldShare = {
    world: new Blob(['abcd']),
    filename: 'world.sqlite3',
    nextChunkIndex: 0,
  };
  const onProgress = vi.fn();

  await expect(uploadSharedWorld(pending, onProgress)).rejects.toThrow(
    'Upload interrupted',
  );
  expect(pending.nextChunkIndex).toBe(1);

  await expect(uploadSharedWorld(pending, onProgress)).resolves.toBe('world');
  expect(
    onProgress.mock.calls.map(([progress]) => progress.loaded),
  ).toStrictEqual([0, 1, 2, 3, 2, 3, 4]);
  expect(fetch.mock.calls.map((call) => String(call[0]))).toStrictEqual([
    'https://api.example.test/api/game-worlds',
    'https://api.example.test/api/game-worlds/world/upload-url',
    'https://api.example.test/new/complete',
  ]);
  expect(uploads.map(({ url }) => url)).toStrictEqual([
    'https://api.example.test/old/0',
    'https://api.example.test/new/0',
    'https://api.example.test/new/1',
    'https://api.example.test/new/1',
  ]);
  expect(uploads[2].headers.get('Content-Range')).toBe('bytes 2-3/4');
});

test('reports progress within a single chunk before the server acknowledges it', async () => {
  const pending: PendingWorldShare = {
    world: new Blob(['abcdefgh']),
    filename: 'world.sqlite3',
    nextChunkIndex: 0,
  };
  const events: { loaded: number; confirmedChunks: number }[] = [];
  const stages = vi.fn();

  mockChunkUploads([{ status: 204, progress: [2, 4, 6, 8] }]);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          worldId: 'world',
          writeToken: 'secret',
          chunkSize: 1024,
          chunkUrlTemplate: 'https://api.example.test/chunks/{chunkIndex}',
          completeUrl: 'https://api.example.test/complete',
        }),
      )
      .mockResolvedValueOnce(Response.json({ status: 'complete' })),
  );

  await uploadSharedWorld(
    pending,
    ({ loaded }) => {
      events.push({ loaded, confirmedChunks: pending.nextChunkIndex });
    },
    stages,
  );

  expect(events).toStrictEqual([
    { loaded: 0, confirmedChunks: 0 },
    { loaded: 2, confirmedChunks: 0 },
    { loaded: 4, confirmedChunks: 0 },
    { loaded: 6, confirmedChunks: 0 },
    { loaded: 8, confirmedChunks: 0 },
  ]);
  expect(pending.nextChunkIndex).toBe(1);
  expect(stages.mock.calls.map(([stage]) => stage)).toStrictEqual([
    'reserving',
    'uploading',
    'finalizing',
  ]);
});

test.each([true, false])(
  'reports streamed download progress with a known total: %s',
  async (hasTotal) => {
    using _now = vi.spyOn(performance, 'now').mockReturnValue(0);

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

    expect([...new Uint8Array(buffer)]).toStrictEqual([1, 2, 3, 4, 5]);
    expect(onProgress.mock.calls.map(([progress]) => progress)).toStrictEqual([
      { loaded: 0, total: hasTotal ? 5 : null },
      { loaded: 5, total: hasTotal ? 5 : null },
    ]);
  },
);

test('throttles download updates while keeping progress monotonic and reporting completion', async () => {
  let now = 0;
  let remaining = 10;

  using _now = vi.spyOn(performance, 'now').mockImplementation(() => {
    now += 40;

    return now;
  });

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (remaining === 0) {
        controller.close();

        return;
      }

      controller.enqueue(new Uint8Array([remaining]));
      remaining -= 1;
    },
  });
  const onProgress = vi.fn();

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: { 'content-length': '10' },
      }),
    ),
  );

  await downloadSharedWorld('shared-world', 'download-token', onProgress);

  const loaded = onProgress.mock.calls.map(([progress]) => progress.loaded);

  expect(loaded[0]).toBe(0);
  expect(loaded.at(-1)).toBe(10);
  expect(loaded.length).toBeGreaterThan(2);
  expect(loaded.length).toBeLessThan(11);
  expect(
    loaded.every((value, index) => index === 0 || value > loaded[index - 1]),
  ).toBe(true);
});

test('uses the original file size for progress when the response is compressed', async () => {
  const onProgress = vi.fn();

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(new Uint8Array(100), {
        headers: {
          'x-world-size': '100',
          'content-length': '20',
          'content-encoding': 'gzip',
        },
      }),
    ),
  );

  await downloadSharedWorld('shared-world', 'download-token', onProgress);

  expect(onProgress).toHaveBeenLastCalledWith({ loaded: 100, total: 100 });
});

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
