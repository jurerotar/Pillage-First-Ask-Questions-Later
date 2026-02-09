import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { inject } from 'vitest';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';

declare module 'vitest' {
  export interface ProvidedContext {
    seededDbBuffer: Uint8Array;
  }
}

let sqlite3: Sqlite3Static | null = null;

export const prepareTestDatabase = async (): Promise<DbFacade> => {
  if (!sqlite3) {
    sqlite3 = await sqlite3InitModule();
  }

  const injectedBuffer = inject('seededDbBuffer');

  const oo1Db = new sqlite3.oo1.DB();
  const ptr = sqlite3.wasm.alloc(injectedBuffer.byteLength);
  sqlite3.wasm.heap8u().set(injectedBuffer, ptr);
  sqlite3.capi.sqlite3_deserialize(
    oo1Db.pointer!,
    'main',
    ptr,
    injectedBuffer.byteLength,
    injectedBuffer.byteLength,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  return createDbFacade(oo1Db, false);
};
