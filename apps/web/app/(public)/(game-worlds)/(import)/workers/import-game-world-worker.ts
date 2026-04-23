import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import {
  type Server,
  serverDbSchema,
} from '@pillage-first/types/models/server';

export type ImportGameWorldWorkerPayload = {
  databaseBuffer: ArrayBuffer;
};

export type ImportGameWorldWorkerResponse =
  | {
      resolved: true;
      server: Server;
    }
  | {
      resolved: false;
      error: string;
    };

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<ImportGameWorldWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );

    const { databaseBuffer } = event.data;

    try {
      sqlite3 ??= await sqlite3InitModule();

      const id = crypto.randomUUID();
      const slug = `s-${id.slice(0, 4)}`;

      opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${slug}`,
      });

      const mainDbPath = `/${slug}.sqlite3`;

      await opfsSahPool.importDb(mainDbPath, new Uint8Array(databaseBuffer));

      database = new opfsSahPool.OpfsSAHPoolDb(mainDbPath);

      database.exec({
        sql: 'UPDATE servers SET id = $id, slug = $slug;',
        bind: {
          $id: id,
          $slug: slug,
        },
      });

      const serverRow = database.selectObject(
        'SELECT id, version, name, slug, created_at, seed, map_size, speed, player_name, player_tribe FROM servers;',
      );

      const server = serverDbSchema.parse(serverRow);

      globalThis.postMessage({
        resolved: true,
        server,
      } satisfies ImportGameWorldWorkerResponse);
    } catch (error) {
      console.error(error);
      globalThis.postMessage({
        resolved: false,
        error:
          'Failed to import game world database. The file may be corrupted or incompatible.',
      } satisfies ImportGameWorldWorkerResponse);
    } finally {
      database?.close();
      opfsSahPool?.pauseVfs();
      globalThis.close();
    }
  },
);
