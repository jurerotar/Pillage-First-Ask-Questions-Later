import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DB_PATH = join('node_modules', '@pillage-first', 'dev', 'schema.sqlite');
const SCHEMA_DIR = join('app', 'db', 'schemas');

((): void => {
  // Ensure parent folder exists
  mkdirSync(dirname(DB_PATH), { recursive: true });

  // Remove old DB if present
  try {
    rmSync(DB_PATH);
  } catch {
    // ignore if file not found
  }

  const db = new DatabaseSync(DB_PATH);

  try {
    // Be explicit about FK behavior
    db.exec('PRAGMA foreign_keys = ON;');

    // Collect and sort schema files
    const files = readdirSync(SCHEMA_DIR)
      .filter((f) => f.endsWith('-schema.sql'))
      .sort();

    // All-or-nothing
    db.exec('BEGIN;');

    for (const filename of files) {
      const fullPath = join(SCHEMA_DIR, filename);
      const sql = readFileSync(fullPath, 'utf-8');
      try {
        db.exec(sql);
        // biome-ignore lint/suspicious/noConsole: progress log
        console.log(`[init] Applied: ${filename}`);
      } catch (err) {
        // Include filename to pinpoint the failing migration
        console.error(`[init] Failed applying ${filename}:`, err);
        db.exec('ROLLBACK;');
        db.close();
        process.exit(1);
      }
    }

    db.exec('COMMIT;');
    // biome-ignore lint/suspicious/noConsole: final log
    console.log(`✅ Created SQLite DB at: ${DB_PATH}`);
  } catch (err) {
    // Catch any unexpected errors (e.g., BEGIN/COMMIT issues)
    console.error('[init] Unexpected error during schema creation:', err);
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore if transaction wasn't started
    }
    db.close();
    process.exit(1);
  }

  db.close();
})();
