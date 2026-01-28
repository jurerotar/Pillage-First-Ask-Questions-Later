import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { TestProject } from 'vitest/node';
import { serverMock } from '@pillage-first/mocks/server';
import { createDbFacade } from '@pillage-first/utils/facades/database';
import { migrateAndSeed } from '../index.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    seededDbBuffer: Uint8Array;
  }
}

const setup = async ({ provide }: TestProject): Promise<void> => {
  const sqlite3 = await sqlite3InitModule();
  const oo1Db = new sqlite3.oo1.DB(':memory:', 'c');
  const database = createDbFacade(oo1Db, false);

  database.exec({
    sql: `
      PRAGMA page_size = 4096;
      PRAGMA locking_mode = EXCLUSIVE;
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA foreign_keys = OFF;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_spill = OFF;
      PRAGMA count_changes = OFF;
      PRAGMA cache_size = -2000;
      PRAGMA secure_delete = OFF;
    `,
  });

  migrateAndSeed(database, serverMock);

  const cachedDb = sqlite3.capi.sqlite3_js_db_export(oo1Db.pointer!, 'main');

  provide('seededDbBuffer', cachedDb);

  oo1Db.close();
};

export default setup;
