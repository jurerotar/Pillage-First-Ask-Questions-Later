import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test, vi } from 'vitest';
import { createApp } from '../app.ts';
import type { AppConfig } from '../config.ts';
import type { Statistics } from '../statistics.ts';
import { Store } from '../store.ts';
import {
  cleanupExpiredWorlds,
  sharedWorldLifetimeMs,
} from '../world-retention.ts';

const sqliteFile = Buffer.concat([
  Buffer.from('SQLite format 3\u0000', 'ascii'),
  Buffer.alloc(512),
]);

const createTestApp = async (overrides: Partial<AppConfig> = {}) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'pillage-remote-api-'));

  const config: AppConfig = {
    apiToken: 'a'.repeat(32),
    appDirectory: join(tmpdir(), 'app'),
    dataDirectory,
    maxChunkBytes: 1024,
    maxFileBytes: 2048,
    maxReportBytes: 2048,
    publicBaseUrl: 'https://api.example.test',
    uploadLinkTtlMinutes: 60,
    uploadUrlSecret: 's'.repeat(32),
    ...overrides,
  };

  const store = await Store.create(dataDirectory);

  return {
    config,
    dataDirectory,
    store,
    app: createApp({ config, store }),
    [Symbol.asyncDispose]: async () => {
      store.close();
      await rm(dataDirectory, { force: true, recursive: true });
    },
  };
};

const uploadSharedWorld = async (
  app: ReturnType<typeof createApp>,
  contents = sqliteFile,
) => {
  const response = await app.request('/api/game-worlds', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filename: 'world.sqlite3', size: contents.length }),
  });

  expect(response.status).toBe(201);

  const reservation = (await response.json()) as {
    worldId: string;
    writeToken: string;
    chunkUrlTemplate: string;
    completeUrl: string;
  };

  const chunk = await app.request(
    reservation.chunkUrlTemplate.replace('{chunkIndex}', '0'),
    {
      method: 'PUT',
      body: contents,
      headers: {
        'content-length': String(contents.length),
        'content-range': `bytes 0-${contents.length - 1}/${contents.length}`,
      },
    },
  );

  expect(chunk.status).toBe(204);

  return reservation;
};

test('persists usage statistics and counts shared transfer retries and imports correctly', async () => {
  await using testApp = await createTestApp();
  const { app, store, config, dataDirectory } = testApp;
  const headers = { authorization: `Bearer ${config.apiToken}` };
  expect((await app.request('/api/admin/statistics')).status).toBe(401);
  const initial = store.getStatistics();
  expect(initial.sharedUploadsCompleted).toBe(0);
  const share = await uploadSharedWorld(app);
  expect(store.getStatistics().sharedUploadsReserved).toBe(1);
  expect(store.getStatistics().sharedUploadsCompleted).toBe(0);
  for (let index = 0; index < 2; index += 1) {
    expect(
      (await app.request(share.completeUrl, { method: 'POST' })).status,
    ).toBe(200);
  }
  const path = `/api/game-worlds/${share.worldId}`;
  expect(
    (await app.request(`${path}/download`, { method: 'POST' })).status,
  ).toBe(400);
  const downloadHeaders = {
    authorization: `Bearer ${'download-token'.repeat(3)}`,
  };
  for (let index = 0; index < 2; index += 1) {
    const response = await app.request(`${path}/download`, {
      method: 'POST',
      headers: downloadHeaders,
    });
    expect(response.status).toBe(200);
    await response.arrayBuffer();
  }
  for (let index = 0; index < 2; index += 1) {
    expect(
      (await app.request(path, { method: 'DELETE', headers: downloadHeaders }))
        .status,
    ).toBe(204);
  }
  const response = await app.request('/api/admin/statistics', { headers });
  expect(response.status).toBe(200);
  const statistics = (await response.json()) as Statistics;
  expect(statistics).toMatchObject({
    trackingStartedAt: initial.trackingStartedAt,
    sharedUploadsReserved: 1,
    sharedUploadsCompleted: 1,
    sharedUploadedBytes: sqliteFile.length,
    sharedDownloadsStarted: 2,
    sharedDownloadBytesRequested: 2 * sqliteFile.length,
    sharedImportsConfirmed: 1,
    reportUploadsCompleted: 0,
    reportsSubmitted: 0,
  });
  using reopened = await Store.create(dataDirectory);
  expect(reopened.getStatistics()).toStrictEqual(statistics);
});

test('counts report transitions and attachment transfers without losing totals on deletion', async () => {
  await using testApp = await createTestApp();
  const { app, store, config, dataDirectory } = testApp;
  const headers = { authorization: `Bearer ${config.apiToken}` };
  const response = await app.request('/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Bug', description: 'Broken turn' }),
  });
  expect(response.status).toBe(201);
  const { reportId } = (await response.json()) as { reportId: string };
  const upload = store.createUpload({
    reportId,
    originalName: 'world.sqlite3',
    expectedBytes: sqliteFile.length,
  })!;
  await writeFile(
    join(dataDirectory, 'uploads', upload.storageName),
    sqliteFile,
  );
  store.completeUpload(upload.id, 'application/vnd.sqlite3');
  store.completeUpload(upload.id, 'application/vnd.sqlite3');
  const path = `/api/admin/reports/${reportId}`;
  expect((await app.request(`${path}/world`)).status).toBe(401);
  expect(
    (await app.request(`${path}/world`, { method: 'HEAD', headers })).status,
  ).toBe(200);
  expect(store.getStatistics().reportDownloadsStarted).toBe(0);
  const download = await app.request(`${path}/world`, { headers });
  expect(download.status).toBe(200);
  await download.arrayBuffer();
  for (let index = 0; index < 2; index += 1) {
    expect(
      (await app.request(`${path}/close`, { method: 'POST', headers })).status,
    ).toBe(200);
  }
  expect((await app.request(path, { method: 'DELETE', headers })).status).toBe(
    204,
  );
  expect((await app.request(path, { method: 'DELETE', headers })).status).toBe(
    404,
  );
  expect(store.getStatistics()).toMatchObject({
    reportsSubmitted: 1,
    reportsClosed: 1,
    reportsDeleted: 1,
    reportUploadsReserved: 1,
    reportUploadsCompleted: 1,
    reportUploadedBytes: sqliteFile.length,
    reportDownloadsStarted: 1,
    reportDownloadBytesRequested: sqliteFile.length,
    sharedUploadsCompleted: 0,
    sharedDownloadsStarted: 0,
  });
});

test('enables statistics on an existing database without inventing historical totals', async () => {
  await using testApp = await createTestApp();
  const { dataDirectory, store } = testApp;
  store.createReport({
    title: 'Old report',
    description: 'Existing',
    contact: null,
    uploadExpiresAt: null,
    writeTokenHash: 'hash',
  });
  using database = new DatabaseSync(join(dataDirectory, 'metadata.sqlite'));
  const triggers = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'")
    .all() as { name: string }[];
  for (const { name } of triggers) {
    database.exec(`DROP TRIGGER ${name}`);
  }
  database.exec('DROP TABLE statistics');
  using upgraded = await Store.create(dataDirectory);
  expect(upgraded.listReports()).toHaveLength(1);
  expect(upgraded.getStatistics().reportsSubmitted).toBe(0);
  upgraded.closeReport(upgraded.listReports()[0].id);
  expect(upgraded.getStatistics().reportsClosed).toBe(1);
});

test('previews an uploaded world without claiming it, then invalidates the preview after import', async () => {
  await using testApp = await createTestApp({
    maxChunkBytes: 65_536,
    maxFileBytes: 65_536,
    maxReportBytes: 65_536,
  });

  const { app, dataDirectory, store } = testApp;
  const path = join(dataDirectory, 'preview-test.sqlite3');

  {
    using database = new DatabaseSync(path);

    database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE servers (name TEXT, version TEXT, speed INTEGER, map_size INTEGER, player_name TEXT, player_tribe TEXT);
      INSERT INTO servers VALUES ('UnicornBorough', '0.4.74', 3, 200, 'Explorer', 'gauls');
    `);
  }

  const contents = await readFile(path);
  const share = await uploadSharedWorld(app, contents);
  const previewPath = `/api/game-worlds/${share.worldId}`;

  expect((await app.request(previewPath)).status).toBe(404);

  await app.request(share.completeUrl, { method: 'POST' });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await app.request(previewPath);

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toStrictEqual({
      name: 'UnicornBorough',
      version: '0.4.74',
      speed: 3,
      mapSize: 200,
      playerName: 'Explorer',
      tribe: 'gauls',
      size: contents.length,
    });
  }

  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toContain(
    `${store.getUploadForWorld(share.worldId)!.storageName}-shm`,
  );

  const headers = { authorization: `Bearer ${'token'.repeat(8)}` };
  const download = await app.request(`${previewPath}/download`, {
    method: 'POST',
    headers,
  });

  expect(download.status).toBe(200);
  expect(Buffer.from(await download.arrayBuffer())).toStrictEqual(contents);
  expect(store.getWorld(share.worldId)).toBeDefined();

  await app.request(previewPath, { method: 'DELETE', headers });

  expect((await app.request(previewPath)).status).toBe(404);
  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toStrictEqual(
    [],
  );
});

test('shares a world separately from reports, claims it on confirmation, and deletes it after import', async () => {
  await using testApp = await createTestApp();

  const { app, store, dataDirectory } = testApp;

  const share = await uploadSharedWorld(app);
  const path = `/api/game-worlds/${share.worldId}`;
  const token = 'download-token-'.repeat(3);
  const download = () => {
    return app.request(`${path}/download`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
  };

  expect((await download()).status).toBe(404);
  expect(
    (await app.request(share.completeUrl, { method: 'POST' })).status,
  ).toBe(200);
  expect(store.listReports()).toStrictEqual([]);
  expect((await app.request(`${path}/download`)).status).toBe(404);
  expect(
    (await app.request(`${path}/download`, { method: 'POST' })).status,
  ).toBe(400);

  const response = await download();

  expect(response.status).toBe(200);
  expect(response.headers.get('x-world-size')).toBe(String(sqliteFile.length));
  expect(response.headers.get('content-length')).toBe(
    String(sqliteFile.length),
  );
  expect(Buffer.from(await response.arrayBuffer())).toStrictEqual(sqliteFile);
  expect(store.getWorld(share.worldId)).toBeDefined();

  // A retry from the same device is safe; another device cannot import concurrently.
  const repeated = await download();

  expect(repeated.status).toBe(200);

  await repeated.arrayBuffer();

  expect(
    (
      await app.request(`${path}/download`, {
        method: 'POST',
        headers: { authorization: `Bearer ${'other-token'.repeat(4)}` },
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await app.request(path, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${share.writeToken}` },
      })
    ).status,
  ).toBe(401);

  const options = {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  };

  expect((await app.request(path, options)).status).toBe(204);
  expect((await app.request(path, options)).status).toBe(204);
  expect(store.getWorld(share.worldId)).toBeUndefined();
  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toStrictEqual(
    [],
  );
  await expect(readdir(join(dataDirectory, 'staging'))).resolves.toStrictEqual(
    [],
  );
  expect((await download()).status).toBe(404);
  expect(
    (await app.request(share.completeUrl, { method: 'POST' })).status,
  ).toBe(401);
});

test('expires shared worlds after 24 hours and cleans up completed and pending uploads without deleting reports', async () => {
  await using testApp = await createTestApp();

  const { app, config, dataDirectory, store } = testApp;
  const now = Date.now();
  using clock = vi.spyOn(Date, 'now').mockReturnValue(now);

  const completed = await uploadSharedWorld(app);
  const pending = await uploadSharedWorld(app);

  await app.request(completed.completeUrl, { method: 'POST' });

  const completedPath = join(
    dataDirectory,
    'uploads',
    store.getUploadForWorld(completed.worldId)!.storageName,
  );
  await writeFile(`${completedPath}-wal`, '');
  await writeFile(`${completedPath}-shm`, Buffer.alloc(32_768));

  const report = store.createReport({
    title: 'Keep this report',
    description: 'Details',
    contact: null,
    writeTokenHash: 'hash',
    uploadExpiresAt: null,
  });

  const reportUpload = store.createUpload({
    reportId: report.id,
    expectedBytes: 100,
    originalName: 'report.sqlite3',
  });

  clock.mockReturnValue(now + sharedWorldLifetimeMs - 1);

  await cleanupExpiredWorlds(config, store);

  expect(store.getWorld(completed.worldId)).toBeDefined();
  expect(store.getWorld(pending.worldId)).toBeDefined();

  clock.mockReturnValue(now + sharedWorldLifetimeMs);

  const download = await app.request(
    `/api/game-worlds/${completed.worldId}/download`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${'token'.repeat(8)}` },
    },
  );

  const renewal = await app.request(
    `/api/game-worlds/${pending.worldId}/upload-url`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${pending.writeToken}` },
    },
  );

  expect(download.status).toBe(404);
  expect(renewal.status).toBe(401);
  expect(
    (await app.request(`/api/game-worlds/${completed.worldId}`)).status,
  ).toBe(404);

  await cleanupExpiredWorlds(config, store);
  await cleanupExpiredWorlds(config, store);

  expect(store.getStatistics()).toMatchObject({
    sharedWorldsExpired: 2,
    sharedImportsConfirmed: 0,
    sharedUploadsReserved: 2,
    sharedUploadsCompleted: 1,
    sharedUploadedBytes: sqliteFile.length,
    sharedDownloadsStarted: 0,
    reportsSubmitted: 1,
    reportsDeleted: 0,
  });

  expect(store.getWorld(completed.worldId)).toBeUndefined();
  expect(store.getWorld(pending.worldId)).toBeUndefined();
  expect(store.getUploadForWorld(completed.worldId)).toBeUndefined();
  expect(store.getUploadForWorld(pending.worldId)).toBeUndefined();
  expect(store.getReport(report.id)).toBeDefined();
  expect(store.getUpload(reportUpload!.id)).toBeDefined();
  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toStrictEqual(
    [],
  );
  await expect(readdir(join(dataDirectory, 'staging'))).resolves.toStrictEqual(
    [],
  );
});

test('validates shared upload requests, SQLite contents, and renewal capabilities', async () => {
  await using testApp = await createTestApp();

  const { app } = testApp;

  for (const body of [
    'invalid',
    JSON.stringify({ filename: 'world.sqlite3', size: -1 }),
  ]) {
    expect(
      (await app.request('/api/game-worlds', { method: 'POST', body })).status,
    ).toBe(400);
  }

  expect(
    (
      await app.request('/api/game-worlds', {
        method: 'POST',
        body: JSON.stringify({ filename: 'world.sqlite3', size: 2049 }),
      })
    ).status,
  ).toBe(413);

  const share = await uploadSharedWorld(app, Buffer.alloc(100));
  const path = `/api/game-worlds/${share.worldId}`;

  expect(
    (await app.request(`${path}/upload-url`, { method: 'POST' })).status,
  ).toBe(401);
  expect(
    (
      await app.request(`${path}/upload-url`, {
        method: 'POST',
        headers: { authorization: `Bearer ${share.writeToken}` },
      })
    ).status,
  ).toBe(200);
  expect(
    (await app.request(share.completeUrl, { method: 'POST' })).status,
  ).toBe(415);
  expect(
    (
      await app.request(`${path}/download`, {
        method: 'POST',
        headers: { authorization: `Bearer ${'t'.repeat(32)}` },
      })
    ).status,
  ).toBe(404);
});

test('creates, chunk-uploads, and authorizes download of a SQLite world', async () => {
  await using testApp = await createTestApp();

  const { app, dataDirectory, store } = testApp;

  const createResponse = await app.request('/api/reports', {
    body: JSON.stringify({
      description: 'The game stalled after the last turn.',
      title: 'Turn does not complete',
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  expect(createResponse.status).toBe(201);

  const report = (await createResponse.json()) as {
    reportId: string;
    writeToken: string;
  };

  const reserveResponse = await app.request(
    `/api/reports/${report.reportId}/world`,
    {
      body: JSON.stringify({
        filename: '../../world.sqlite3',
        size: sqliteFile.length,
      }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  expect(reserveResponse.status).toBe(201);

  const reservation = (await reserveResponse.json()) as {
    chunkUrlTemplate: string;
    completeUrl: string;
  };

  // A lost reservation response must not reserve more storage on retry.
  const repeatedReservation = await app.request(
    `/api/reports/${report.reportId}/world`,
    {
      body: JSON.stringify({
        filename: '../../world.sqlite3',
        size: sqliteFile.length,
      }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  expect(repeatedReservation.status).toBe(200);

  const repeatedReservationBody = (await repeatedReservation.json()) as {
    chunkUrlTemplate: string;
  };

  expect(repeatedReservationBody.chunkUrlTemplate.split('?')[0]).toBe(
    reservation.chunkUrlTemplate.split('?')[0],
  );
  expect(store.getReservedBytes(report.reportId)).toBe(sqliteFile.length);

  const differentReservation = await app.request(
    `/api/reports/${report.reportId}/world`,
    {
      body: JSON.stringify({
        filename: 'different.sqlite3',
        size: sqliteFile.length,
      }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  expect(differentReservation.status).toBe(409);

  const renewResponse = await app.request(
    `/api/reports/${report.reportId}/world/upload-url`,
    {
      headers: { authorization: `Bearer ${report.writeToken}` },
      method: 'POST',
    },
  );

  expect(renewResponse.status).toBe(200);

  const refreshedReservation = (await renewResponse.json()) as {
    chunkUrlTemplate: string;
  };

  const chunkUrl = refreshedReservation.chunkUrlTemplate.replace(
    '{chunkIndex}',
    '0',
  );

  const chunkResponse = await app.request(chunkUrl, {
    body: sqliteFile,
    headers: {
      'content-length': String(sqliteFile.length),
      'content-range': `bytes 0-${sqliteFile.length - 1}/${sqliteFile.length}`,
    },
    method: 'PUT',
  });

  expect(chunkResponse.status).toBe(204);

  const completeResponse = await app.request(reservation.completeUrl, {
    method: 'POST',
  });

  expect(completeResponse.status).toBe(200);

  // A lost completion response can be retried even after refreshing its URL.
  const completedReservationResponse = await app.request(
    `/api/reports/${report.reportId}/world/upload-url`,
    {
      headers: { authorization: `Bearer ${report.writeToken}` },
      method: 'POST',
    },
  );

  expect(completedReservationResponse.status).toBe(200);

  const completedReservation = (await completedReservationResponse.json()) as {
    completeUrl: string;
  };
  const repeatedCompletion = await app.request(
    completedReservation.completeUrl,
    { method: 'POST' },
  );

  expect(repeatedCompletion.status).toBe(200);
  await expect(repeatedCompletion.json()).resolves.toStrictEqual({
    status: 'complete',
  });

  const deniedDownload = await app.request(
    `/api/admin/reports/${report.reportId}/world`,
  );

  expect(deniedDownload.status).toBe(401);

  const download = await app.request(
    `/api/admin/reports/${report.reportId}/world`,
    {
      headers: { authorization: `Bearer ${'a'.repeat(32)}` },
    },
  );

  expect(download.status).toBe(200);
  expect(download.headers.get('content-type')).toBe('application/vnd.sqlite3');
  expect(Buffer.from(await download.arrayBuffer())).toStrictEqual(sqliteFile);

  const headers = { authorization: `Bearer ${'a'.repeat(32)}` };

  const details = await app.request(`/api/admin/reports/${report.reportId}`, {
    headers,
  });

  const data = (await details.json()) as {
    world: { downloadUrl: string; filename: string; status: string };
  };

  expect(data.world.filename).toBe('../../world.sqlite3');
  expect(data.world.status).toBe('complete');
  expect(data.world.downloadUrl).toBe(
    `/api/admin/reports/${report.reportId}/world`,
  );

  const deleted = await app.request(`/api/admin/reports/${report.reportId}`, {
    headers,
    method: 'DELETE',
  });

  expect(deleted.status).toBe(204);
  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toStrictEqual(
    [],
  );
  await expect(readdir(join(dataDirectory, 'staging'))).resolves.toStrictEqual(
    [],
  );
  expect(
    (
      await app.request(`/api/admin/reports/${report.reportId}/world`, {
        headers,
      })
    ).status,
  ).toBe(404);
});

test('rejects world files without a server-recognized SQLite signature', async () => {
  await using testApp = await createTestApp();

  const { app } = testApp;

  const createResponse = await app.request('/api/reports', {
    body: JSON.stringify({
      description: 'A reproducible issue.',
      title: 'Bad save',
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  const report = (await createResponse.json()) as {
    reportId: string;
    writeToken: string;
  };

  const reserveResponse = await app.request(
    `/api/reports/${report.reportId}/world`,
    {
      body: JSON.stringify({ filename: 'world.sqlite3', size: 32 }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  const reservation = (await reserveResponse.json()) as {
    chunkUrlTemplate: string;
    completeUrl: string;
  };

  const contents = Buffer.alloc(32);

  const uploadResponse = await app.request(
    reservation.chunkUrlTemplate.replace('{chunkIndex}', '0'),
    {
      body: contents,
      headers: {
        'content-length': '32',
        'content-range': 'bytes 0-31/32',
      },
      method: 'PUT',
    },
  );

  expect(uploadResponse.status).toBe(204);

  const completeResponse = await app.request(reservation.completeUrl, {
    method: 'POST',
  });

  expect(completeResponse.status).toBe(415);
});

test('admin routes require the admin token and omit upload credentials', async () => {
  await using testApp = await createTestApp();

  const { app } = testApp;

  const created = await app.request('/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Report',
      description: 'Details',
      contact: 'hello@example.test',
    }),
  });

  const { reportId, writeToken } = (await created.json()) as {
    reportId: string;
    writeToken: string;
  };

  for (const [path, method] of [
    ['/api/admin/reports', 'GET'],
    [`/api/admin/reports/${reportId}`, 'GET'],
    [`/api/admin/reports/${reportId}/close`, 'POST'],
    [`/api/admin/reports/${reportId}`, 'DELETE'],
    [`/api/admin/reports/${reportId}/world`, 'GET'],
  ]) {
    expect((await app.request(path, { method })).status).toBe(401);
    expect(
      (
        await app.request(path, {
          method,
          headers: { authorization: `Bearer ${writeToken}` },
        })
      ).status,
    ).toBe(401);
  }

  const headers = { authorization: `Bearer ${'a'.repeat(32)}` };
  const list = await app.request('/api/admin/reports', { headers });

  const { reports } = (await list.json()) as {
    reports: Record<string, unknown>[];
  };

  expect(reports.length).toBe(1);
  expect(reports[0].id).toBe(reportId);
  expect(reports[0].contact).toBe('hello@example.test');
  expect(reports[0].status).toBe('open');
  expect(reports[0].world).toBe(null);
  expect('writeTokenHash' in reports[0]).toBe(false);
  expect('writeToken' in reports[0]).toBe(false);

  for (const [path, method] of [
    ['/api/admin/reports/missing', 'GET'],
    ['/api/admin/reports/missing/close', 'POST'],
    ['/api/admin/reports/missing', 'DELETE'],
  ]) {
    expect((await app.request(path, { headers, method })).status).toBe(404);
  }
});

test('closing is idempotent and remains persisted when the database is reopened', async () => {
  await using testApp = await createTestApp();

  const { app, store, dataDirectory } = testApp;

  const report = store.createReport({
    title: 'Report',
    description: 'Details',
    contact: null,
    uploadExpiresAt: null,
    writeTokenHash: 'hash',
  });

  const options = {
    method: 'POST',
    headers: { authorization: `Bearer ${'a'.repeat(32)}` },
  };

  const response = await app.request(
    `/api/admin/reports/${report.id}/close`,
    options,
  );

  const closed = (await response.json()) as {
    status: string;
    closedAt: number;
  };

  expect(response.status).toBe(200);
  expect(closed.status).toBe('closed');
  expect(closed.closedAt > 0).toBe(true);

  const repeated = await app.request(
    `/api/admin/reports/${report.id}/close`,
    options,
  );

  expect(((await repeated.json()) as { closedAt: number }).closedAt).toBe(
    closed.closedAt,
  );

  using reopened = await Store.create(dataDirectory);

  expect(reopened.getReport(report.id)?.closedAt).toBe(closed.closedAt);
});

test('deleting a pending upload removes files, chunks, and signed upload access', async () => {
  await using testApp = await createTestApp();

  const { app, store, dataDirectory } = testApp;

  const response = await app.request('/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Pending report', description: 'Details' }),
  });

  const { reportId, writeToken } = (await response.json()) as {
    reportId: string;
    writeToken: string;
  };

  const reservation = await app.request(`/api/reports/${reportId}/world`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${writeToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      filename: 'world.sqlite3',
      size: sqliteFile.length,
    }),
  });

  const { chunkUrlTemplate, uploadId } = (await reservation.json()) as {
    chunkUrlTemplate: string;
    uploadId: string;
  };

  const chunkUrl = chunkUrlTemplate.replace('{chunkIndex}', '0');

  const chunkOptions = {
    method: 'PUT',
    body: sqliteFile,
    headers: {
      'content-length': String(sqliteFile.length),
      'content-range': `bytes 0-${sqliteFile.length - 1}/${sqliteFile.length}`,
    },
  };

  expect((await app.request(chunkUrl, chunkOptions)).status).toBe(204);
  expect((await readdir(join(dataDirectory, 'staging'))).length).toBe(1);
  expect(store.getChunks(uploadId).length).toBe(1);

  const uploadPath = join(
    dataDirectory,
    'uploads',
    store.getUpload(uploadId)!.storageName,
  );
  await writeFile(`${uploadPath}-wal`, '');
  await writeFile(`${uploadPath}-shm`, Buffer.alloc(32_768));

  const deleted = await app.request(`/api/admin/reports/${reportId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${'a'.repeat(32)}` },
  });

  expect(deleted.status).toBe(204);
  expect(store.getReport(reportId)).toBe(undefined);
  expect(store.getUpload(uploadId)).toBe(undefined);
  expect(store.getChunks(uploadId)).toStrictEqual([]);
  await expect(readdir(join(dataDirectory, 'staging'))).resolves.toStrictEqual(
    [],
  );
  await expect(readdir(join(dataDirectory, 'uploads'))).resolves.toStrictEqual(
    [],
  );
  expect((await app.request(chunkUrl, chunkOptions)).status).toBe(401);
});

test('the web app origin can preflight both admin and public requests', async () => {
  await using testApp = await createTestApp();

  const { store, config } = testApp;

  const app = createApp({
    store,
    config: {
      ...config,
      allowedOrigins: ['https://game.example.test', 'http://localhost:5173'],
    },
  });

  const response = await app.request('/api/admin/reports/test', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://game.example.test',
      'access-control-request-method': 'DELETE',
      'access-control-request-headers': 'authorization',
    },
  });

  expect(response.status).toBe(204);
  expect(response.headers.get('access-control-allow-origin')).toBe(
    'https://game.example.test',
  );
  expect(
    response.headers.get('access-control-allow-methods')?.includes('DELETE'),
  ).toBe(true);

  const game = await app.request('/api/reports', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://game.example.test',
      'access-control-request-method': 'POST',
    },
  });

  expect(game.headers.get('access-control-allow-origin')).toBe(
    'https://game.example.test',
  );

  const local = await app.request('/api/game-worlds', {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });

  expect(local.status).toBe(204);
  expect(local.headers.get('access-control-allow-origin')).toBe(
    'http://localhost:5173',
  );

  const lookalike = await app.request('/api/game-worlds', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://game.example.test.attacker.test',
      'access-control-request-method': 'POST',
    },
  });

  expect(lookalike.headers.get('access-control-allow-origin')).toBeNull();

  const untrusted = await app.request('/api/admin/reports/test', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://untrusted.example.test',
      'access-control-request-method': 'DELETE',
    },
  });

  expect(untrusted.headers.get('access-control-allow-origin')).toBe(null);
});
