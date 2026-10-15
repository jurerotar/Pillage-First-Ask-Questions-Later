import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

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
  reportId: string;
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
  report_id: string;
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
  status: row.status,
  storageName: row.storage_name,
});

export class Store {
  #database: DatabaseSync;

  private constructor(database: DatabaseSync) {
    this.#database = database;
  }

  static async create(dataDirectory: string): Promise<Store> {
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
        write_token_hash TEXT NOT NULL,
        upload_expires_at INTEGER,
        created_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL UNIQUE REFERENCES reports(id),
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

    const columns = database.prepare('PRAGMA table_info(reports)').all();
    if (!columns.some((column) => column.name === 'closed_at')) {
      database.exec('ALTER TABLE reports ADD COLUMN closed_at INTEGER;');
    }

    return new Store(database);
  }

  close(): void {
    this.#database.close();
  }

  createReport(input: Omit<Report, 'closedAt' | 'createdAt' | 'id'>): Report {
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

  getReport(id: string): Report | undefined {
    const row = this.#database
      .prepare('SELECT * FROM reports WHERE id = ?')
      .get(id) as ReportRow | undefined;
    return row && toReport(row);
  }

  listReports(): Report[] {
    return (
      this.#database
        .prepare('SELECT * FROM reports ORDER BY created_at DESC, id DESC')
        .all() as ReportRow[]
    ).map(toReport);
  }

  closeReport(id: string): void {
    this.#database
      .prepare(
        'UPDATE reports SET closed_at = ? WHERE id = ? AND closed_at IS NULL',
      )
      .run(Date.now(), id);
  }

  deleteReport(id: string): void {
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

  createUpload(input: {
    expectedBytes: number;
    originalName: string;
    reportId: string;
  }): Upload | undefined {
    const upload: Upload = {
      completedAt: null,
      createdAt: Date.now(),
      detectedMime: null,
      expectedBytes: input.expectedBytes,
      id: randomUUID(),
      originalName: input.originalName,
      reportId: input.reportId,
      status: 'pending',
      storageName: `${randomUUID()}.sqlite3`,
    };

    try {
      this.#database
        .prepare(
          `INSERT INTO uploads (
            id, report_id, original_name, expected_bytes, storage_name, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          upload.id,
          upload.reportId,
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

  getUpload(id: string): Upload | undefined {
    const row = this.#database
      .prepare('SELECT * FROM uploads WHERE id = ?')
      .get(id) as UploadRow | undefined;
    return row && toUpload(row);
  }

  getUploadForReport(reportId: string): Upload | undefined {
    const row = this.#database
      .prepare('SELECT * FROM uploads WHERE report_id = ?')
      .get(reportId) as UploadRow | undefined;
    return row && toUpload(row);
  }

  getReservedBytes(reportId: string): number {
    const row = this.#database
      .prepare(
        'SELECT SUM(expected_bytes) AS total FROM uploads WHERE report_id = ?',
      )
      .get(reportId) as CountRow;
    return row.total ?? 0;
  }

  hasChunk(uploadId: string, chunkIndex: number): boolean {
    return Boolean(
      this.#database
        .prepare(
          'SELECT 1 FROM upload_chunks WHERE upload_id = ? AND chunk_index = ?',
        )
        .get(uploadId, chunkIndex),
    );
  }

  addChunk(uploadId: string, chunkIndex: number, bytes: number): void {
    this.#database
      .prepare(
        'INSERT INTO upload_chunks (upload_id, chunk_index, bytes) VALUES (?, ?, ?)',
      )
      .run(uploadId, chunkIndex, bytes);
  }

  getChunks(uploadId: string): ChunkRow[] {
    return this.#database
      .prepare(
        'SELECT chunk_index, bytes FROM upload_chunks WHERE upload_id = ? ORDER BY chunk_index',
      )
      .all(uploadId) as ChunkRow[];
  }

  completeUpload(uploadId: string, detectedMime: string): void {
    this.#database
      .prepare(
        `UPDATE uploads
         SET status = 'complete', detected_mime = ?, completed_at = ?
         WHERE id = ? AND status = 'pending'`,
      )
      .run(detectedMime, Date.now(), uploadId);
  }

  consumeRateLimit(key: string, maximum: number, windowMs: number): boolean {
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
