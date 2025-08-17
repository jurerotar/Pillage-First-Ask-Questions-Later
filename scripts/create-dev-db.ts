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

  // Apply all *-schema.sql files in lexical order
  const files = readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('-schema.sql'))
    .sort();

  for (const filename of files) {
    const fullPath = join(SCHEMA_DIR, filename);
    const sql = readFileSync(fullPath, 'utf-8');
    db.exec(sql);
  }
  // biome-ignore lint/suspicious/noConsole: Needed to show results
  console.log(`Created a new SQLite DB at: ${DB_PATH}`);
  db.close();
})();
