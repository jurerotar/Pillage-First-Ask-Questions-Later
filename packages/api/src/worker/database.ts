import type {
  OpfsSAHPoolDatabase,
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
let database: OpfsSAHPoolDatabase | null = null;

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

  const initializedOpfsSahPool = await retryWhenFileSystemLocked(() =>
    sqlite3!.installOpfsSAHPoolVfs(opfsSahPoolOptions),
  );

  // Database doesn't exist, common when opening game worlds created before the engine rewrite or when opening a deleted game world
  if (initializedOpfsSahPool.getFileCount() === 0) {
    throw new OutdatedDatabaseSchemaError();
  }

  database = new initializedOpfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

  const dbFacade = createDbFacade(database, false);

  dbFacade.exec({
    sql: `
      PRAGMA foreign_keys = ON;        -- keep referential integrity
      PRAGMA locking_mode = EXCLUSIVE; -- single-writer optimization
      PRAGMA journal_mode = OFF;       -- fastest; no rollback journal
      PRAGMA synchronous = OFF;        -- don't wait for OS to flush (fast, risky)
      PRAGMA temp_store = MEMORY;      -- temp tables + indices kept in RAM
      PRAGMA cache_size = -20000;      -- negative = KB, so -20000 => 20 MB cache
      PRAGMA secure_delete = OFF;      -- faster deletes (don't overwrite freed pages)
      PRAGMA wal_autocheckpoint = 0;   -- no WAL checkpointing (noop unless WAL used)
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

  upgradeDb(dbFacade);

  return dbFacade;
};

export const closeWorkerDatabase = (dbFacade: DbFacade): void => {
  dbFacade.close();
  database?.close();
  database = null;
};
