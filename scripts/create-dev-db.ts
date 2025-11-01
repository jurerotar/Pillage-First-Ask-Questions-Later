import { DatabaseSync } from 'node:sqlite';
import { readFile, rm, mkdir, writeFile, glob } from 'node:fs/promises';
import { dirname, join, basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
// SQLite file
const DB_EXPORT_PATH = join(EXPORT_PATH, 'schema.sqlite');
// Text export(s)
const DB_SCHEMA_EXPORT_PATH = join(EXPORT_PATH, 'schema.sql');

await (async (): Promise<void> => {
  await mkdir(dirname(DB_EXPORT_PATH), { recursive: true });

  try {
    await rm(DB_EXPORT_PATH);
  } catch {
    // ignore if file not found
  }

  const db = new DatabaseSync(DB_EXPORT_PATH);

  db.exec('PRAGMA foreign_keys = ON;');

  db.exec('BEGIN;');

  for await (const fullPath of glob('app/db/schemas/**/*.sql')) {
    const sql = await readFile(fullPath, 'utf8');
    try {
      db.exec(sql);
    } catch (error) {
      console.error(`[init] Failed applying schema ${fullPath}:`, error);
      db.exec('ROLLBACK;');
      db.close();
    }
  }

  for await (const fullPath of glob('app/db/indexes/**/*.sql')) {
    const sql = await readFile(fullPath, 'utf8');
    try {
      db.exec(sql);
    } catch (error) {
      console.error(`[init] Failed applying index ${fullPath}:`, error);
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
    FROM
      sqlite_schema
    WHERE
      sql IS NOT NULL
      AND name NOT LIKE 'sqlite_%' -- exclude implicit auto-indexes
      AND type IN ('table', 'view', 'index', 'trigger')
    ORDER BY
      ${orderCase}
  `);
  const rows = stmt.all() as { sql: string }[];

  const body = rows.map((r) => ensureSemicolon(r.sql)).join('\n');
  const exportContent = [header(), body, footer()].join('\n');

  await writeFile(DB_SCHEMA_EXPORT_PATH, exportContent, 'utf8');
  const schemaUrl = pathToFileURL(resolve(DB_SCHEMA_EXPORT_PATH)).href;

  // biome-ignore lint/suspicious/noConsole: It's fine here
  console.log(`✅ Created SQLite DB at: ${schemaUrl}`);

  db.close();
})();
