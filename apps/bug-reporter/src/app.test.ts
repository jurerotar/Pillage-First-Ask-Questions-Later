import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
    config,
    dataDirectory,
    store,
    app: createApp({ config, store }),
    cleanup: async () => {
      store.close();
      await rm(dataDirectory, { force: true, recursive: true });
    },
  };
};

test('creates, chunk-uploads, and authorizes download of a SQLite world', async () => {
  const { app, dataDirectory, cleanup } = await createTestApp();

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

    const headers = { authorization: `Bearer ${'a'.repeat(32)}` };
    const details = await app.request(`/api/admin/reports/${report.reportId}`, {
      headers,
    });
    const data = (await details.json()) as {
      world: { downloadUrl: string; filename: string; status: string };
    };
    assert.equal(data.world.filename, '../../world.sqlite3');
    assert.equal(data.world.status, 'complete');
    assert.equal(
      data.world.downloadUrl,
      `/api/admin/reports/${report.reportId}/world`,
    );
    const deleted = await app.request(`/api/admin/reports/${report.reportId}`, {
      headers,
      method: 'DELETE',
    });
    assert.equal(deleted.status, 204);
    assert.deepEqual(await readdir(join(dataDirectory, 'uploads')), []);
    assert.deepEqual(await readdir(join(dataDirectory, 'staging')), []);
    assert.equal(
      (
        await app.request(`/api/admin/reports/${report.reportId}/world`, {
          headers,
        })
      ).status,
      404,
    );
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

test('admin routes require the admin token and omit upload credentials', async () => {
  const { app, cleanup } = await createTestApp();
  try {
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
      assert.equal((await app.request(path, { method })).status, 401);
      assert.equal(
        (
          await app.request(path, {
            method,
            headers: { authorization: `Bearer ${writeToken}` },
          })
        ).status,
        401,
      );
    }
    const headers = { authorization: `Bearer ${'a'.repeat(32)}` };
    const list = await app.request('/api/admin/reports', { headers });
    const { reports } = (await list.json()) as {
      reports: Record<string, unknown>[];
    };
    assert.equal(reports.length, 1);
    assert.equal(reports[0].id, reportId);
    assert.equal(reports[0].contact, 'hello@example.test');
    assert.equal(reports[0].status, 'open');
    assert.equal(reports[0].world, null);
    assert.equal('writeTokenHash' in reports[0], false);
    assert.equal('writeToken' in reports[0], false);
    for (const [path, method] of [
      ['/api/admin/reports/missing', 'GET'],
      ['/api/admin/reports/missing/close', 'POST'],
      ['/api/admin/reports/missing', 'DELETE'],
    ]) {
      assert.equal((await app.request(path, { headers, method })).status, 404);
    }
  } finally {
    await cleanup();
  }
});

test('closing is idempotent and remains persisted when the database is reopened', async () => {
  const { app, store, dataDirectory, cleanup } = await createTestApp();
  try {
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
    assert.equal(response.status, 200);
    assert.equal(closed.status, 'closed');
    assert.ok(closed.closedAt > 0);
    const repeated = await app.request(
      `/api/admin/reports/${report.id}/close`,
      options,
    );
    assert.equal(
      ((await repeated.json()) as { closedAt: number }).closedAt,
      closed.closedAt,
    );
    const reopened = await Store.create(dataDirectory);
    try {
      assert.equal(reopened.getReport(report.id)?.closedAt, closed.closedAt);
    } finally {
      reopened.close();
    }
  } finally {
    await cleanup();
  }
});

test('deleting a pending upload removes files, chunks, and signed upload access', async () => {
  const { app, store, dataDirectory, cleanup } = await createTestApp();
  try {
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
    assert.equal((await app.request(chunkUrl, chunkOptions)).status, 204);
    assert.equal((await readdir(join(dataDirectory, 'staging'))).length, 1);
    assert.equal(store.getChunks(uploadId).length, 1);
    const deleted = await app.request(`/api/admin/reports/${reportId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${'a'.repeat(32)}` },
    });
    assert.equal(deleted.status, 204);
    assert.equal(store.getReport(reportId), undefined);
    assert.equal(store.getUpload(uploadId), undefined);
    assert.deepEqual(store.getChunks(uploadId), []);
    assert.deepEqual(await readdir(join(dataDirectory, 'staging')), []);
    assert.deepEqual(await readdir(join(dataDirectory, 'uploads')), []);
    assert.equal((await app.request(chunkUrl, chunkOptions)).status, 401);
  } finally {
    await cleanup();
  }
});

test('existing metadata databases gain closed status without losing reports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pillage-bug-migration-'));
  const database = new DatabaseSync(join(directory, 'metadata.sqlite'));
  database.exec(`
    CREATE TABLE reports (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, contact TEXT,
      write_token_hash TEXT NOT NULL, upload_expires_at INTEGER, created_at INTEGER NOT NULL
    ) STRICT;
    INSERT INTO reports VALUES ('existing', 'Old report', 'Details', NULL, 'hash', NULL, 1);
  `);
  database.close();
  try {
    const store = await Store.create(directory);
    try {
      assert.equal(store.getReport('existing')?.title, 'Old report');
      assert.equal(store.getReport('existing')?.closedAt, null);
      store.closeReport('existing');
      assert.ok(store.getReport('existing')?.closedAt);
    } finally {
      store.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('admin origin can preflight deletion without changing the game origin', async () => {
  const { store, config, cleanup } = await createTestApp();
  const app = createApp({
    store,
    config: {
      ...config,
      allowedOrigin: 'https://game.example.test',
      adminAllowedOrigin: 'https://admin.example.test',
    },
  });
  try {
    const response = await app.request('/api/admin/reports/test', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://admin.example.test',
        'access-control-request-method': 'DELETE',
        'access-control-request-headers': 'authorization',
      },
    });
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get('access-control-allow-origin'),
      'https://admin.example.test',
    );
    assert.ok(
      response.headers.get('access-control-allow-methods')?.includes('DELETE'),
    );
    const game = await app.request('/api/reports', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://game.example.test',
        'access-control-request-method': 'POST',
      },
    });
    assert.equal(
      game.headers.get('access-control-allow-origin'),
      'https://game.example.test',
    );
  } finally {
    await cleanup();
  }
});
