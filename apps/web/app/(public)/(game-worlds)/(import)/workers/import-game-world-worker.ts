import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
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

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<ImportGameWorldWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );

    const { databaseBuffer } = event.data;

    try {
      const sqlite3 = await sqlite3InitModule({
        locateFile: () => sqliteWasmUrl,
      });

      const id = crypto.randomUUID();
      const slug = `s-${id.slice(0, 4)}`;

      const destDir = `/pillage-first-ask-questions-later/${slug}`;
      const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: destDir,
      });
      const mainDbPath = `/${slug}.sqlite3`;

      await opfsSahPool.importDb(mainDbPath, new Uint8Array(databaseBuffer));

      const opfsDb = new opfsSahPool.OpfsSAHPoolDb(mainDbPath);

      opfsDb.exec({
        sql: 'UPDATE servers SET id = $id, slug = $slug;',
        bind: {
          $id: id,
          $slug: slug,
        },
      });

      const serverRow = opfsDb.selectObject('SELECT * FROM servers;');

      const server = serverDbSchema.parse(serverRow);

      opfsDb.close();
      opfsSahPool.pauseVfs();

      globalThis.postMessage({
        resolved: true,
        server,
      } satisfies ImportGameWorldWorkerResponse);

      globalThis.close();
    } catch (error) {
      console.error(error);
      globalThis.postMessage({
        resolved: false,
        error:
          'Failed to import game world database. The file may be corrupted or incompatible.',
      } satisfies ImportGameWorldWorkerResponse);
      globalThis.close();
    }
  },
);
