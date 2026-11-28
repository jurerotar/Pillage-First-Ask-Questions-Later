import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { env } from '@pillage-first/utils/env';
import {
  type ErrorWithContext,
  MissingGameWorldDatabaseError,
  OutdatedAppVersionError,
  OutdatedDatabaseSchemaError,
  serializeError,
} from '@pillage-first/utils/errors';
import {
  createDbFacade,
  type DbFacade,
  type OpfsSahPoolOptions,
} from '@pillage-first/utils/facades/database';
import {
  encodeAppVersionToDatabaseUserVersion,
  isSupportedDatabaseUserVersion,
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
  let dbFacade: DbFacade | undefined;
  let fileNames: string[] | null = null;
  let databaseVersion: number | null = null;

  try {
    if (sqlite3 === null) {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );

      sqlite3 = await sqlite3InitModule();
    }

    const opfsSahPoolOptions: OpfsSahPoolOptions = {
      directory: `/pillage-first-ask-questions-later/${serverSlug}`,
      preserveOnInitFailure: true,
    };

    const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
    opfsSahPool = pool;

    const databasePath = `/${serverSlug}.sqlite3`;

    fileNames = pool.getFileNames();

    if (!fileNames.includes(databasePath)) {
      throw new MissingGameWorldDatabaseError();
    }

    const connection = new pool.OpfsSAHPoolDb(databasePath);
    database = connection;

    dbFacade = createDbFacade(connection, () => {
      const checkpointStatus = connection.selectValue(
        'PRAGMA main.wal_checkpoint(TRUNCATE)',
      );

      if (checkpointStatus !== 0) {
        throw new Error(
          'Could not checkpoint the game world database for export',
        );
      }

      return pool.exportFile(databasePath);
    });

    dbFacade.execMulti({
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
      schema: z.number(),
    })!;

    databaseVersion = version;
    const currentVersion = encodeAppVersionToDatabaseUserVersion(env.VERSION);

    if (version > currentVersion) {
      throw new OutdatedAppVersionError();
    }

    if (!isSupportedDatabaseUserVersion(version, env.VERSION)) {
      throw new OutdatedDatabaseSchemaError();
    }

    if (version !== currentVersion) {
      const { upgradeDb } = await import('../db/migrations/upgrade-db');
      upgradeDb(dbFacade, version);
    }

    return dbFacade;
  } catch (error) {
    const failure: ErrorWithContext =
      error instanceof Error ? error : new Error(String(error));

    failure.context = {
      ...failure.context,
      database_server_slug: serverSlug,
      database_app_version: env.VERSION,
      database_file_names: JSON.stringify(fileNames),
      database_user_version:
        databaseVersion === null ? 'unknown' : String(databaseVersion),
    };

    try {
      releaseWorkerDatabase(dbFacade);
    } catch (cleanupError) {
      failure.context.database_cleanup_error = JSON.stringify(
        serializeError(cleanupError),
      );
    }

    throw failure;
  }
};

export const closeWorkerDatabase = (dbFacade: DbFacade): void => {
  releaseWorkerDatabase(dbFacade);
};
