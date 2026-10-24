import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
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
let sqlite3Promise: Promise<Sqlite3Static> | null = null;

type TestDatabaseInject = (key: 'seededDbBuffer') => Uint8Array;

const getSqlite3 = async (): Promise<Sqlite3Static> => {
  if (!sqlite3Promise) {
    sqlite3Promise = sqlite3InitModule();
  }

  if (!sqlite3) {
    sqlite3 = await sqlite3Promise;
  }

  return sqlite3;
};

const getVitestInject = async (): Promise<TestDatabaseInject> => {
  const { inject } = await import('vitest');

  return inject;
};

export const prepareTestDatabase = async (
  contextInject?: TestDatabaseInject,
): Promise<DbFacade & Disposable> => {
  const sqlite3 = await getSqlite3();
  const inject = contextInject ?? (await getVitestInject());

  const injectedBuffer = inject('seededDbBuffer');

  const oo1Db = new sqlite3.oo1.DB();

  oo1Db.checkRc(
    sqlite3.capi.sqlite3_deserialize(
      oo1Db.pointer!,
      'main',
      sqlite3.wasm.allocFromTypedArray(injectedBuffer),
      injectedBuffer.byteLength,
      injectedBuffer.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
        sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
    ),
  );

  const facade = createDbFacade(oo1Db, () =>
    sqlite3.capi.sqlite3_js_db_export(oo1Db.pointer!, 'main'),
  );
  let closed = false;
  const close = (): void => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      facade.close();
    } finally {
      oo1Db.close();
    }
  };

  return { ...facade, close, [Symbol.dispose]: close };
};
