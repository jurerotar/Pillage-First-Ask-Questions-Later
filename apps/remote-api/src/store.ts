import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { initializeStatistics, type Statistics } from './statistics.ts';

export type Report = {
  closedAt: number | null;
  contact: string | null;
  createdAt: number;
  description: string;
  id: string;
  title: string;
  uploadExpiresAt: number | null;
  writeTokenHash: string;
};

export type Upload = {
  completedAt: number | null;
  createdAt: number;
  detectedMime: string | null;
  expectedBytes: number;
  id: string;
  originalName: string;
  reportId: string | null;
  worldId: string | null;
  status: 'pending' | 'complete';
  storageName: string;
};

type CountRow = { total: number | null };
type ChunkRow = { chunk_index: number; bytes: number };
type ReportRow = {
  closed_at: number | null;
  contact: string | null;
  created_at: number;
  description: string;
  id: string;
  title: string;
  upload_expires_at: number | null;
  write_token_hash: string;
};
type UploadRow = {
  completed_at: number | null;
  created_at: number;
  detected_mime: string | null;
  expected_bytes: number;
  id: string;
  original_name: string;
  report_id: string | null;
  world_id: string | null;
  status: 'pending' | 'complete';
  storage_name: string;
};

const toReport = (row: ReportRow): Report => ({
  closedAt: row.closed_at,
  contact: row.contact,
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  title: row.title,
  uploadExpiresAt: row.upload_expires_at,
  writeTokenHash: row.write_token_hash,
});

const toUpload = (row: UploadRow): Upload => ({
  completedAt: row.completed_at,
  createdAt: row.created_at,
  detectedMime: row.detected_mime,
  expectedBytes: row.expected_bytes,
  id: row.id,
  originalName: row.original_name,
  reportId: row.report_id,
  worldId: row.world_id,
  status: row.status,
  storageName: row.storage_name,
});

export class Store implements Disposable {
  #database: DatabaseSync;

  private constructor(database: DatabaseSync) {
    this.#database = database;
  }

  public static async create(dataDirectory: string): Promise<Store> {
    await Promise.all(
      ['uploads', 'staging'].map((directory) =>
        mkdir(join(dataDirectory, directory), { recursive: true }),
      ),
    );

    const database = new DatabaseSync(join(dataDirectory, 'metadata.sqlite'));
    database.exec('PRAGMA journal_mode = WAL;');
    database.exec('PRAGMA foreign_keys = ON;');
    database.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        contact TEXT,
        closed_at INTEGER,
        write_token_hash TEXT NOT NULL,
        upload_expires_at INTEGER,
        created_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS game_worlds (
        id TEXT PRIMARY KEY,
        upload_expires_at INTEGER,
        write_token_hash TEXT NOT NULL,
        download_token_hash TEXT,
        claimed_until INTEGER
      ) STRICT;
      CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        report_id TEXT UNIQUE REFERENCES reports(id),
        world_id TEXT UNIQUE REFERENCES game_worlds(id),
        original_name TEXT NOT NULL,
        expected_bytes INTEGER NOT NULL CHECK(expected_bytes > 0),
        storage_name TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('pending', 'complete')),
        detected_mime TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      ) STRICT;
      CREATE TABLE IF NOT EXISTS upload_chunks (
        upload_id TEXT NOT NULL REFERENCES uploads(id),
        chunk_index INTEGER NOT NULL CHECK(chunk_index >= 0),
        bytes INTEGER NOT NULL CHECK(bytes > 0),
        PRIMARY KEY (upload_id, chunk_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        window_started_at INTEGER NOT NULL,
        count INTEGER NOT NULL CHECK(count > 0)
      ) STRICT;
    `);

    initializeStatistics(database);

    return new Store(database);
  }

  public getStatistics(): Statistics {
    const { id: _id, ...statistics } = this.#database
      .prepare('SELECT * FROM statistics WHERE id = 1')
      .get() as Statistics & { id: number };
    return statistics;
  }

  public recordDownload(uploadId: string): void {
    this.#database
      .prepare(`
      UPDATE statistics SET
        sharedDownloadsStarted = sharedDownloadsStarted + CASE WHEN uploads.world_id IS NOT NULL THEN 1 ELSE 0 END,
        sharedDownloadBytesRequested = sharedDownloadBytesRequested + CASE WHEN uploads.world_id IS NOT NULL THEN uploads.expected_bytes ELSE 0 END,
        reportDownloadsStarted = reportDownloadsStarted + CASE WHEN uploads.report_id IS NOT NULL THEN 1 ELSE 0 END,
        reportDownloadBytesRequested = reportDownloadBytesRequested + CASE WHEN uploads.report_id IS NOT NULL THEN uploads.expected_bytes ELSE 0 END
      FROM uploads WHERE statistics.id = 1 AND uploads.id = ? AND uploads.status = 'complete'
    `)
      .run(uploadId);
  }

  public close(): void {
    this.#database.close();
  }

  public [Symbol.dispose](): void {
    this.close();
  }

  public createReport(
    input: Omit<Report, 'closedAt' | 'createdAt' | 'id'>,
  ): Report {
    const report: Report = {
      ...input,
      closedAt: null,
      createdAt: Date.now(),
      id: randomUUID(),
    };
    this.#database
      .prepare(
        `INSERT INTO reports (
          id, title, description, contact, write_token_hash, upload_expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        report.id,
        report.title,
        report.description,
        report.contact,
        report.writeTokenHash,
        report.uploadExpiresAt,
        report.createdAt,
      );
    return report;
  }

  public getReport(id: string): Report | undefined {
    const row = this.#database
      .prepare('SELECT * FROM reports WHERE id = ?')
      .get(id) as ReportRow | undefined;
    return row && toReport(row);
  }

  public listReports(): Report[] {
    return (
      this.#database
        .prepare('SELECT * FROM reports ORDER BY created_at DESC, id DESC')
        .all() as ReportRow[]
    ).map(toReport);
  }

  public closeReport(id: string): void {
    this.#database
      .prepare(
        'UPDATE reports SET closed_at = ? WHERE id = ? AND closed_at IS NULL',
      )
      .run(Date.now(), id);
  }

  public deleteReport(id: string): void {
    this.#database.exec('BEGIN IMMEDIATE;');
    try {
      this.#database
        .prepare(
          'DELETE FROM upload_chunks WHERE upload_id IN (SELECT id FROM uploads WHERE report_id = ?)',
        )
        .run(id);
      this.#database.prepare('DELETE FROM uploads WHERE report_id = ?').run(id);
      this.#database.prepare('DELETE FROM reports WHERE id = ?').run(id);
      this.#database.exec('COMMIT;');
    } catch (error) {
      this.#database.exec('ROLLBACK;');
      throw error;
    }
  }

  public createUpload(input: {
    expectedBytes: number;
    originalName: string;
    reportId?: string;
    worldId?: string;
  }): Upload | undefined {
    const upload: Upload = {
      completedAt: null,
      createdAt: Date.now(),
      detectedMime: null,
      expectedBytes: input.expectedBytes,
      id: randomUUID(),
      originalName: input.originalName,
      reportId: input.reportId ?? null,
      worldId: input.worldId ?? null,
      status: 'pending',
      storageName: `${randomUUID()}.sqlite3`,
    };

    try {
      this.#database
        .prepare(
          `INSERT INTO uploads (
            id, report_id, world_id, original_name, expected_bytes, storage_name, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          upload.id,
          upload.reportId,
          upload.worldId,
          upload.originalName,
          upload.expectedBytes,
          upload.storageName,
          upload.status,
          upload.createdAt,
        );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('UNIQUE constraint')
      ) {
        return undefined;
      }
      throw error;
    }

    return upload;
  }

  public createWorld(
    uploadExpiresAt: number | null,
    writeTokenHash: string,
  ): { id: string; uploadExpiresAt: number | null } {
    const world = { id: randomUUID(), uploadExpiresAt };
    this.#database
      .prepare(
        'INSERT INTO game_worlds (id, upload_expires_at, write_token_hash) VALUES (?, ?, ?)',
      )
      .run(world.id, uploadExpiresAt, writeTokenHash);
    return world;
  }

  public getWorld(
    id: string,
  ):
    | { id: string; uploadExpiresAt: number | null; writeTokenHash: string }
    | undefined {
    const row = this.#database
      .prepare(
        'SELECT id, upload_expires_at, write_token_hash FROM game_worlds WHERE id = ?',
      )
      .get(id) as
      | {
          id: string;
          upload_expires_at: number | null;
          write_token_hash: string;
        }
      | undefined;
    return (
      row && {
        id: row.id,
        uploadExpiresAt: row.upload_expires_at,
        writeTokenHash: row.write_token_hash,
      }
    );
  }

  public getUploadForWorld(worldId: string): Upload | undefined {
    const row = this.#database
      .prepare('SELECT * FROM uploads WHERE world_id = ?')
      .get(worldId) as UploadRow | undefined;
    return row && toUpload(row);
  }

  public claimWorld(id: string, tokenHash: string): boolean {
    return (
      this.#database
        .prepare(`UPDATE game_worlds SET download_token_hash = ?, claimed_until = ?
      WHERE id = ? AND (download_token_hash IS NULL OR download_token_hash = ? OR claimed_until <= ?)`)
        .run(tokenHash, Date.now() + 15 * 60 * 1000, id, tokenHash, Date.now())
        .changes === 1
    );
  }

  public ownsWorldClaim(id: string, tokenHash: string): boolean {
    return Boolean(
      this.#database
        .prepare(
          'SELECT 1 FROM game_worlds WHERE id = ? AND download_token_hash = ?',
        )
        .get(id, tokenHash),
    );
  }

  public deleteWorld(id: string, reason?: 'imported' | 'expired'): void {
    this.#database.exec('BEGIN IMMEDIATE;');
    try {
      if (reason) {
        const counter =
          reason === 'imported'
            ? 'sharedImportsConfirmed'
            : 'sharedWorldsExpired';
        this.#database
          .prepare(`
          UPDATE statistics SET ${counter} = ${counter} + 1
          WHERE id = 1 AND EXISTS (SELECT 1 FROM game_worlds WHERE id = ?)
        `)
          .run(id);
      }
      this.#database
        .prepare(
          'DELETE FROM upload_chunks WHERE upload_id IN (SELECT id FROM uploads WHERE world_id = ?)',
        )
        .run(id);
      this.#database.prepare('DELETE FROM uploads WHERE world_id = ?').run(id);
      this.#database.prepare('DELETE FROM game_worlds WHERE id = ?').run(id);
      this.#database.exec('COMMIT;');
    } catch (error) {
      this.#database.exec('ROLLBACK;');
      throw error;
    }
  }

  public listExpiredWorldIds(createdBefore: number): string[] {
    const rows = this.#database
      .prepare(`
      SELECT game_worlds.id FROM game_worlds
      LEFT JOIN uploads ON uploads.world_id = game_worlds.id
      WHERE uploads.created_at <= ? OR uploads.id IS NULL
    `)
      .all(createdBefore) as { id: string }[];

    return rows.map(({ id }) => id);
  }

  public getUpload(id: string): Upload | undefined {
    const row = this.#database
      .prepare('SELECT * FROM uploads WHERE id = ?')
      .get(id) as UploadRow | undefined;
    return row && toUpload(row);
  }

  public getUploadForReport(reportId: string): Upload | undefined {
    const row = this.#database
      .prepare('SELECT * FROM uploads WHERE report_id = ?')
      .get(reportId) as UploadRow | undefined;
    return row && toUpload(row);
  }

  public getReservedBytes(reportId: string): number {
    const row = this.#database
      .prepare(
        'SELECT SUM(expected_bytes) AS total FROM uploads WHERE report_id = ?',
      )
      .get(reportId) as CountRow;
    return row.total ?? 0;
  }

  public hasChunk(uploadId: string, chunkIndex: number): boolean {
    return Boolean(
      this.#database
        .prepare(
          'SELECT 1 FROM upload_chunks WHERE upload_id = ? AND chunk_index = ?',
        )
        .get(uploadId, chunkIndex),
    );
  }

  public addChunk(uploadId: string, chunkIndex: number, bytes: number): void {
    this.#database
      .prepare(
        'INSERT INTO upload_chunks (upload_id, chunk_index, bytes) VALUES (?, ?, ?)',
      )
      .run(uploadId, chunkIndex, bytes);
  }

  public getChunks(uploadId: string): ChunkRow[] {
    return this.#database
      .prepare(
        'SELECT chunk_index, bytes FROM upload_chunks WHERE upload_id = ? ORDER BY chunk_index',
      )
      .all(uploadId) as ChunkRow[];
  }

  public completeUpload(uploadId: string, detectedMime: string): void {
    this.#database
      .prepare(
        `UPDATE uploads
         SET status = 'complete', detected_mime = ?, completed_at = ?
         WHERE id = ? AND status = 'pending'`,
      )
      .run(detectedMime, Date.now(), uploadId);
  }

  public consumeRateLimit(
    key: string,
    maximum: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const current = this.#database
      .prepare('SELECT window_started_at, count FROM rate_limits WHERE key = ?')
      .get(key) as { count: number; window_started_at: number } | undefined;

    if (!current || now - current.window_started_at >= windowMs) {
      this.#database
        .prepare(
          `INSERT INTO rate_limits (key, window_started_at, count) VALUES (?, ?, 1)
           ON CONFLICT(key) DO UPDATE SET window_started_at = excluded.window_started_at, count = 1`,
        )
        .run(key, now);
      return true;
    }

    if (current.count >= maximum) {
      return false;
    }

    this.#database
      .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
      .run(key);
    return true;
  }
}
