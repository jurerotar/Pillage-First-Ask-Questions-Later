import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApp } from './app.ts';
import type { AppConfig } from './config.ts';
import { Store } from './store.ts';

const sqliteFile = Buffer.concat([
  Buffer.from('SQLite format 3\u0000', 'ascii'),
  Buffer.alloc(512),
]);

const createTestApp = async () => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'pillage-bug-reporter-'));
  const config: AppConfig = {
    adminApiToken: 'a'.repeat(32),
    appDirectory: join(tmpdir(), 'app'),
    dataDirectory,
    maxChunkBytes: 1024,
    maxFileBytes: 2048,
    maxReportBytes: 2048,
    publicBaseUrl: 'https://bugs.example.test',
    uploadLinkTtlMinutes: 60,
    uploadUrlSecret: 's'.repeat(32),
  };
  const store = await Store.create(dataDirectory);

  return {
    app: createApp({ config, store }),
    cleanup: async () => {
      store.close();
      await rm(dataDirectory, { force: true, recursive: true });
    },
  };
};

test('creates, chunk-uploads, and authorizes download of a SQLite world', async () => {
  const { app, cleanup } = await createTestApp();

  try {
    const createResponse = await app.request('/api/reports', {
      body: JSON.stringify({
        description: 'The game stalled after the last turn.',
        title: 'Turn does not complete',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    assert.equal(createResponse.status, 201);
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
    assert.equal(reserveResponse.status, 201);
    const reservation = (await reserveResponse.json()) as {
      chunkUrlTemplate: string;
      completeUrl: string;
    };

    const renewResponse = await app.request(
      `/api/reports/${report.reportId}/world/upload-url`,
      {
        headers: { authorization: `Bearer ${report.writeToken}` },
        method: 'POST',
      },
    );
    assert.equal(renewResponse.status, 200);
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
    assert.equal(chunkResponse.status, 204);

    const completeResponse = await app.request(reservation.completeUrl, {
      method: 'POST',
    });
    assert.equal(completeResponse.status, 200);

    const deniedDownload = await app.request(
      `/api/admin/reports/${report.reportId}/world`,
    );
    assert.equal(deniedDownload.status, 401);

    const download = await app.request(
      `/api/admin/reports/${report.reportId}/world`,
      {
        headers: { authorization: `Bearer ${'a'.repeat(32)}` },
      },
    );
    assert.equal(download.status, 200);
    assert.equal(
      download.headers.get('content-type'),
      'application/vnd.sqlite3',
    );
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), sqliteFile);
  } finally {
    await cleanup();
  }
});

test('rejects world files without a server-recognized SQLite signature', async () => {
  const { app, cleanup } = await createTestApp();

  try {
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
    assert.equal(uploadResponse.status, 204);
    const completeResponse = await app.request(reservation.completeUrl, {
      method: 'POST',
    });
    assert.equal(completeResponse.status, 415);
  } finally {
    await cleanup();
  }
});
