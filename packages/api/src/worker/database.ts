import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { upgradeDb } from '@pillage-first/db';
import { env } from '@pillage-first/utils/env';
import { OutdatedDatabaseSchemaError } from '@pillage-first/utils/errors';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import {
  parseAppVersion,
  parseDatabaseUserVersion,
} from '@pillage-first/utils/version';

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;

const releaseWorkerDatabase = (dbFacade?: DbFacade): void => {
  try {
    dbFacade?.close();
  } finally {
    try {
      database?.close();
    } finally {
      database = null;
      opfsSahPool?.pauseVfs();
      opfsSahPool = null;
    }
  }
};

export const openWorkerDatabase = async (
  serverSlug: string,
): Promise<DbFacade> => {
  if (sqlite3 === null) {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );

    sqlite3 = await sqlite3InitModule();
  }

  const opfsSahPoolOptions = {
    directory: `/pillage-first-ask-questions-later/${serverSlug}`,
    forceReinitIfPreviouslyFailed: true,
  };

  opfsSahPool = await retryWhenFileSystemLocked(() =>
    sqlite3!.installOpfsSAHPoolVfs(opfsSahPoolOptions),
  );

  let dbFacade: DbFacade | undefined;

  try {
    // Database doesn't exist, common when opening game worlds created before the engine rewrite or when opening a deleted game world
    if (opfsSahPool.getFileCount() === 0) {
      throw new OutdatedDatabaseSchemaError();
    }

    database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

    dbFacade = createDbFacade(database, false);

    dbFacade.exec({
      sql: `
      PRAGMA foreign_keys = ON;        -- keep referential integrity
      PRAGMA locking_mode = EXCLUSIVE; -- single-writer optimization
      PRAGMA journal_mode = WAL;       -- write-ahead-log
      PRAGMA temp_store = MEMORY;      -- temp tables + indices kept in RAM
      PRAGMA cache_size = -20000;      -- negative = KB, so -20000 => 20 MB cache
      PRAGMA secure_delete = OFF;      -- faster deletes (don't overwrite freed pages)
      PRAGMA synchronous = OFF;        -- fastest; risks losing recent writes on crash
      PRAGMA wal_autocheckpoint = 1000;
    `,
    });

    const version = dbFacade.selectValue({
      sql: 'PRAGMA user_version',
      schema: z.number().nullable(),
    });

    // TODO: This check can be removed in a couple of weeks, since all newly-created game worlds will have user_version
    if (!version) {
      throw new OutdatedDatabaseSchemaError();
    }

    const [, dbMinor] = parseDatabaseUserVersion(version);
    const [, appMinor] = parseAppVersion(env.VERSION);

    if (dbMinor !== appMinor) {
      throw new OutdatedDatabaseSchemaError();
    }

    upgradeDb(dbFacade, version);

    return dbFacade;
  } catch (error) {
    releaseWorkerDatabase(dbFacade);
    throw error;
  }
};

export const closeWorkerDatabase = (dbFacade: DbFacade): void => {
  releaseWorkerDatabase(dbFacade);
};
