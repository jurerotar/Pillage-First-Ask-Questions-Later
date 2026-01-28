import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { serverMock } from '@pillage-first/mocks/server';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { migrateAndSeed } from '../index.ts';

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
