import 'zod/compile';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { env } from '@pillage-first/utils/env';
import { createDbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import { migrateAndSeed } from '../../../../db/src/migrations/migrate';
import { serverMock } from '../../../../mocks/src/server-mock';

export { execute } from '../../core';

export const open = async (bytes?: Uint8Array) => {
  const sqlite = await sqlite3InitModule();
  const raw = new sqlite.oo1.DB(':memory:', 'c');
  if (bytes) {
    raw.checkRc(
      sqlite.capi.sqlite3_deserialize(
        raw.pointer!,
        'main',
        sqlite.wasm.allocFromTypedArray(bytes),
        bytes.length,
        bytes.length,
        sqlite.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
          sqlite.capi.SQLITE_DESERIALIZE_RESIZEABLE,
      ),
    );
  }
  const database = createDbFacade(raw, () =>
    sqlite.capi.sqlite3_js_db_export(raw.pointer!, 'main'),
  );
  database.execMulti({
    sql: 'PRAGMA foreign_keys=OFF; PRAGMA journal_mode=MEMORY; PRAGMA synchronous=OFF; PRAGMA temp_store=MEMORY; PRAGMA cache_size=-20000;',
  });
  if (!bytes) {
    migrateAndSeed(database, {
      ...serverMock,
      id: 'wasm-benchmark',
      slug: 'wasm-benchmark',
      createdAt: 1700000000000,
      version: env.VERSION,
    });
    database.transaction((tx) => {
      tx.exec({ sql: 'DELETE FROM events' });
      for (let i = 0; i < 1000; i++) {
        tx.exec({
          sql: 'INSERT INTO events(type, starts_at, duration, village_id, meta) VALUES ($type, $starts, $duration, $village, $meta)',
          bind: {
            $type: 'troopTraining',
            $starts: 1700000000000 + i * 1000,
            $duration: 1000,
            $village: 1,
            $meta: JSON.stringify({
              unitId: 'PHALANX',
              amount: 1,
              batchId: 'benchmark',
              durationEffectId: 'barracksTrainingDuration',
              buildingId: 'BARRACKS',
            }),
          },
        });
      }
    });
    database.execMulti({
      sql: `PRAGMA user_version=${encodeAppVersionToDatabaseUserVersion(env.VERSION)};`,
    });
  }
  database.execMulti({ sql: 'PRAGMA foreign_keys=ON;' });
  return {
    database,
    raw,
    sqlite,
    close() {
      database.close();
      raw.close();
    },
  };
};

// Snapshot inspection is test-only and is never compiled into the API module.
export const inspect = (
  database: import('@pillage-first/utils/facades/database').DbFacade,
) => {
  const rowSchema = z.record(z.string(), z.unknown());
  return {
    troops: database.selectObjects({
      sql: 'SELECT * FROM troops ORDER BY tile_id, source_tile_id, unit_id',
      schema: rowSchema,
    }),
    resources: database.selectObjects({
      sql: 'SELECT * FROM resource_sites ORDER BY tile_id',
      schema: rowSchema,
    }),
    effects: database.selectObjects({
      sql: 'SELECT * FROM effects ORDER BY id',
      schema: rowSchema,
    }),
    trainingHistory: database.selectObjects({
      sql: 'SELECT * FROM unit_training_history ORDER BY id',
      schema: rowSchema,
    }),
    remainingEvents: database.selectValue({
      sql: 'SELECT COUNT(*) FROM events',
      schema: z.number(),
    }),
  };
};
