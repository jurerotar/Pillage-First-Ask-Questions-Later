import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
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

// Preload history without repeatedly pruning it; subsequent report insertions use the real trigger.
export const seedReportHistory = (
  database: DbFacade,
  options: {
    villageId: number;
    count: number;
    firstTimestamp?: number;
    timestampStep?: number;
  },
) => {
  const { villageId, count, firstTimestamp = 1, timestampStep = 1 } = options;

  database.transaction((db) => {
    const retentionTrigger = db.selectValue({
      sql: "SELECT sql FROM sqlite_schema WHERE type = 'trigger' AND name = 'reports_prune_oldest_before_insert';",
      schema: z.string(),
    });

    if (!retentionTrigger) {
      throw new Error(
        'Report retention trigger must exist before seeding history',
      );
    }

    db.exec({ sql: 'DROP TRIGGER reports_prune_oldest_before_insert;' });
    db.exec({
      sql: `
        WITH RECURSIVE sequence(n) AS (
          SELECT 0
          UNION ALL
          SELECT n + 1 FROM sequence WHERE n + 1 < $count
        )
        INSERT INTO reports (village_id, timestamp, type_id, report_outcome_id)
        SELECT $village_id, $first_timestamp + n * $timestamp_step,
          (SELECT id FROM report_type_ids WHERE report_type = 'adventure'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')
        FROM sequence;
      `,
      bind: {
        $village_id: villageId,
        $count: count,
        $first_timestamp: firstTimestamp,
        $timestamp_step: timestampStep,
      },
    });
    db.execMulti({ sql: retentionTrigger });
  });
};
