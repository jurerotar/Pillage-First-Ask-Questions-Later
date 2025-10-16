import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, basename, resolve } from 'node:path';
import { glob } from 'tinyglobby';
import { pathToFileURL } from 'node:url';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
// SQLite file
const DB_EXPORT_PATH = join(EXPORT_PATH, 'schema.sqlite');
// Text export(s)
const DB_SCHEMA_EXPORT_PATH = join(EXPORT_PATH, 'schema.sql');

await (async (): Promise<void> => {
  mkdirSync(dirname(DB_EXPORT_PATH), { recursive: true });

  try {
    rmSync(DB_EXPORT_PATH);
  } catch {
    // ignore if file not found
  }

  const schemaFiles = await glob('app/db/schemas/**/*.sql', {
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  const indexFiles = await glob('app/db/indexes/**/*.sql', {
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  const db = new DatabaseSync(DB_EXPORT_PATH);

  try {
    db.exec('PRAGMA foreign_keys = ON;');

    db.exec('BEGIN;');

    for (const fullPath of schemaFiles) {
      const sql = readFileSync(fullPath, 'utf8');
      try {
        db.exec(sql);
      } catch (err) {
        console.error(`[init] Failed applying schema ${fullPath}:`, err);
        db.exec('ROLLBACK;');
        db.close();
      }
    }

    for (const fullPath of indexFiles) {
      const sql = readFileSync(fullPath, 'utf8');
      try {
        db.exec(sql);
      } catch (err) {
        console.error(`[init] Failed applying index ${fullPath}:`, err);
        db.exec('ROLLBACK;');
        db.close();
      }
    }

    db.exec('COMMIT;');

    const ensureSemicolon = (stmt: string | null): string =>
      (stmt ?? '').trim().replace(/;?\s*$/u, ';');

    const header = (): string => {
      const now = new Date().toISOString();
      return [
        '-- SQLite schema export',
        `-- Source: ${basename(DB_EXPORT_PATH)}`,
        `-- Generated: ${now}`,
        '',
        'PRAGMA foreign_keys=OFF;',
        'BEGIN TRANSACTION;',
        '',
      ].join('\n');
    };

    const footer = (): string => ['', 'COMMIT;', ''].join('\n');

    const orderCase = `
      CASE type
        WHEN 'table' THEN 1
        WHEN 'view' THEN 2
        WHEN 'index' THEN 3
        WHEN 'trigger' THEN 4
        ELSE 5
      END, name
    `;

    const stmt = db.prepare(`
      SELECT sql
      FROM sqlite_schema
      WHERE sql IS NOT NULL
        AND name NOT LIKE 'sqlite_%' -- exclude implicit auto-indexes
        AND type IN ('table', 'view', 'index', 'trigger')
      ORDER BY ${orderCase}
    `);
    const rows = stmt.all() as Array<{ sql: string }>;

    const body = rows.map((r) => ensureSemicolon(r.sql)).join('\n');
    const exportContent = [header(), body, footer()].join('\n');

    writeFileSync(DB_SCHEMA_EXPORT_PATH, exportContent, 'utf8');
    const schemaUrl = pathToFileURL(resolve(DB_SCHEMA_EXPORT_PATH)).href;

    // biome-ignore lint/suspicious/noConsole: It's fine here
    console.log(`✅ Created SQLite DB at: ${schemaUrl}`);
  } catch (err) {
    console.error('[init] Unexpected error during schema creation:', err);
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore if transaction wasn’t started
    }
    db.close();
  }

  db.close();
})();
