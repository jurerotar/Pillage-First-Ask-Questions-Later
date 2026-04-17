import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';

export type ShareServerWorkerPayload = {
  serverSlug: string;
};

export type ShareServerWorkerResponse =
  | { type: 'database'; databaseBuffer: ArrayBuffer }
  | { type: 'error'; message: string };

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<ShareServerWorkerPayload>) => {
    const { serverSlug } = event.data;

    try {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );

      sqlite3 ??= await sqlite3InitModule();

      opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${serverSlug}`,
      });

      const fileName = `/${serverSlug}.sqlite3`;
      if (!opfsSahPool.getFileNames().includes(fileName)) {
        throw new Error(`Game world ${serverSlug} not found.`);
      }

      const exportedDb = await opfsSahPool.exportFile(fileName);
      const buffer: ArrayBuffer = exportedDb.buffer as ArrayBuffer;

      globalThis.postMessage(
        {
          type: 'database',
          databaseBuffer: buffer,
        } satisfies ShareServerWorkerResponse,
        [buffer],
      );
    } catch (error) {
      console.error('[ShareServerWorker] Export failed:', error);
      let message = 'Failed to prepare game world for sharing.';

      if (
        error instanceof Error &&
        (error.name === 'NoModificationAllowedError' ||
          error.message.includes('NoModificationAllowedError'))
      ) {
        message =
          'The game world is already open on this device. Please close it before reattempting.';
      }

      globalThis.postMessage({
        type: 'error',
        message,
      } satisfies ShareServerWorkerResponse);
    } finally {
      opfsSahPool?.pauseVfs();
      globalThis.close();
    }
  },
);
