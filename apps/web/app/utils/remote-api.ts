import { env } from '@pillage-first/utils/env';

export const getRemoteApiUrl = (path: string): URL => {
  if (!env.VITE_API_URL) {
    throw new Error('The game API is not configured.');
  }

  return new URL(path, env.VITE_API_URL);
};

const checkResponse = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  throw new Error(body?.error ?? `Request failed (${response.status}).`);
};

export const remoteRequest = async (
  path: string,
  init: RequestInit,
): Promise<Response> => {
  return checkResponse(await fetch(getRemoteApiUrl(path), init));
};

const requestJson = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await remoteRequest(path, init);

  return response.json() as Promise<T>;
};

export type WorldUploadReservation = {
  chunkSize: number;
  chunkUrlTemplate: string;
  completeUrl: string;
};

type SharedWorldUploadReservation = WorldUploadReservation & {
  worldId: string;
  writeToken: string;
};

export type TransferProgress = {
  loaded: number;
  total: number | null;
};

export type SharedWorldPreview = {
  name: string;
  version: string;
  speed: number;
  mapSize: number;
  playerName: string;
  tribe: string;
  size: number;
};

export const getSharedWorldPreview = async (
  worldId: string,
  signal?: AbortSignal,
): Promise<SharedWorldPreview> => {
  return requestJson<SharedWorldPreview>(
    `/api/game-worlds/${encodeURIComponent(worldId)}`,
    {
      method: 'GET',
      signal,
    },
  );
};

export const downloadSharedWorld = async (
  worldId: string,
  token: string,
  onProgress: (progress: TransferProgress) => void,
): Promise<ArrayBuffer> => {
  const response = await remoteRequest(
    `/api/game-worlds/${encodeURIComponent(worldId)}/download`,
    { method: 'POST', headers: { authorization: `Bearer ${token}` } },
  );
  const size = Number(
    response.headers.get('x-world-size') ??
      response.headers.get('content-length'),
  );
  const total = Number.isSafeInteger(size) && size > 0 ? size : null;

  onProgress({ loaded: 0, total });

  if (!response.body) {
    const buffer = await response.arrayBuffer();

    onProgress({ loaded: buffer.byteLength, total });

    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let reportedBytes = 0;
  let reportedAt = performance.now();

  const reportProgress = (force = false) => {
    const now = performance.now();

    if (loaded === reportedBytes || (!force && now - reportedAt < 100)) {
      return;
    }

    reportedBytes = loaded;
    reportedAt = now;
    onProgress({ loaded, total });
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      loaded += value.byteLength;
      reportProgress();
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  reportProgress(true);

  return buffer.buffer;
};

export type PendingWorldShare = {
  world: Blob;
  filename: string;
  nextChunkIndex: number;
  reservation?: SharedWorldUploadReservation;
};

export const uploadSharedWorld = async (
  pending: PendingWorldShare,
  onProgress?: (progress: TransferProgress) => void,
): Promise<string> => {
  pending.reservation ??= await requestJson<SharedWorldUploadReservation>(
    '/api/game-worlds',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        filename: pending.filename,
        size: pending.world.size,
      }),
    },
  );

  let reservation = pending.reservation;
  const { worldId, writeToken } = reservation;

  onProgress?.({
    loaded: Math.min(
      pending.nextChunkIndex * reservation.chunkSize,
      pending.world.size,
    ),
    total: pending.world.size,
  });

  const send = async (request: () => Promise<Response>): Promise<Response> => {
    const response = await request();

    if (response.status !== 401) {
      return checkResponse(response);
    }

    const refreshed = await requestJson<WorldUploadReservation>(
      `/api/game-worlds/${worldId}/upload-url`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${writeToken}` },
      },
    );

    reservation = { ...refreshed, worldId, writeToken };
    pending.reservation = reservation;

    return checkResponse(await request());
  };

  while (pending.nextChunkIndex * reservation.chunkSize < pending.world.size) {
    const index = pending.nextChunkIndex;
    const start = index * reservation.chunkSize;
    const end = Math.min(start + reservation.chunkSize, pending.world.size);

    await send(() =>
      fetch(
        reservation.chunkUrlTemplate.replace('{chunkIndex}', String(index)),
        {
          method: 'PUT',
          body: pending.world.slice(start, end),
          headers: {
            'content-range': `bytes ${start}-${end - 1}/${pending.world.size}`,
          },
        },
      ),
    );

    pending.nextChunkIndex += 1;
    onProgress?.({ loaded: end, total: pending.world.size });
  }

  await send(() => fetch(reservation.completeUrl, { method: 'POST' }));

  return worldId;
};
