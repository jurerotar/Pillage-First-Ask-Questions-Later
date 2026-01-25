import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateAndSeed } from '@pillage-first/db';
import { serverMock } from '@pillage-first/mocks/server';
import { createDbFacade, type DbFacade } from './facades/database-facade.ts';

let cachedDb: Uint8Array | null = null;
let preparePromise: Promise<Uint8Array> | null = null;

const sqlite3 = await sqlite3InitModule();

export const prepareTestDatabase = async (): Promise<DbFacade> => {
  if (preparePromise) {
    const cached = await preparePromise;
    const oo1Db = new sqlite3.oo1.DB();
    const ptr = sqlite3.wasm.alloc(cached.byteLength);
    sqlite3.wasm.heap8u().set(cached, ptr);
    sqlite3.capi.sqlite3_deserialize(
      oo1Db.pointer!,
      'main',
      ptr,
      cached.byteLength,
      cached.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
        sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
    );
    return createDbFacade(oo1Db, false);
  }

  preparePromise = (async () => {
    const oo1Db = new sqlite3.oo1.DB(':memory:', 'c');
    const database = createDbFacade(oo1Db, false);

    database.exec({
      sql: `
        PRAGMA page_size = 8192;          -- set before creating tables (optional)
        PRAGMA locking_mode = EXCLUSIVE;  -- avoid file locks
        PRAGMA journal_mode = OFF;        -- no rollback journal
        PRAGMA synchronous = OFF;         -- don't wait on disk
        PRAGMA foreign_keys = OFF;        -- skip FK checks
        PRAGMA temp_store = MEMORY;       -- temp tables in RAM
        PRAGMA cache_spill = OFF;
        PRAGMA count_changes = OFF;
        PRAGMA cache_size = -200000;      -- negative = KB, here ~200MB cache
        PRAGMA secure_delete = OFF;       -- don't wipe deleted content
      `,
    });

    migrateAndSeed(database, serverMock);

    cachedDb = sqlite3.capi.sqlite3_js_db_export(oo1Db.pointer!, 'main');
    return cachedDb;
  })();

  await preparePromise;
  const oo1Db = new sqlite3.oo1.DB();
  const ptr = sqlite3.wasm.alloc(cachedDb!.byteLength);
  sqlite3.wasm.heap8u().set(cachedDb!, ptr);
  sqlite3.capi.sqlite3_deserialize(
    oo1Db.pointer!,
    'main',
    ptr,
    cachedDb!.byteLength,
    cachedDb!.byteLength,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  return createDbFacade(oo1Db, false);
};
