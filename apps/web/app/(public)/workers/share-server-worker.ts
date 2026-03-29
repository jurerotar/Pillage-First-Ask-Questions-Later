export type ShareServerWorkerPayload = {
  serverSlug: string;
};

export type ShareServerWorkerResponse =
  | { type: 'database'; databaseBuffer: ArrayBuffer }
  | { type: 'error'; message: string };

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<ShareServerWorkerPayload>) => {
    const { serverSlug } = event.data;
    console.log('[ShareServerWorker] Starting export for:', serverSlug);

    try {
      console.log('[ShareServerWorker] Initializing sqlite3...');
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );
      const sqlite3 = await sqlite3InitModule();
      console.log('[ShareServerWorker] sqlite3 initialized.');

      console.log('[ShareServerWorker] Installing OpfsSAHPoolVfs...');
      const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${serverSlug}`,
      });
      console.log('[ShareServerWorker] OpfsSAHPoolVfs installed.');

      const fileName = `/${serverSlug}.sqlite3`;
      console.log('[ShareServerWorker] Checking for file:', fileName);
      if (!opfsSahPool.getFileNames().includes(fileName)) {
        console.error(
          '[ShareServerWorker] File not found in SAH pool:',
          fileName,
        );
        throw new Error(`Game world ${serverSlug} not found.`);
      }

      console.log('[ShareServerWorker] Exporting file...');
      const exportedDb = await opfsSahPool.exportFile(fileName);
      const buffer: ArrayBuffer = exportedDb.buffer as ArrayBuffer;
      console.log(
        '[ShareServerWorker] File exported, size:',
        buffer.byteLength,
      );

      globalThis.postMessage(
        {
          type: 'database',
          databaseBuffer: buffer,
        } satisfies ShareServerWorkerResponse,
        [buffer],
      );
      console.log('[ShareServerWorker] Message posted, closing worker.');
      globalThis.close();
    } catch (error) {
      console.error('[ShareServerWorker] Export failed:', error);
      globalThis.postMessage({
        type: 'error',
        message: 'Failed to prepare game world for sharing.',
      } satisfies ShareServerWorkerResponse);
      globalThis.close();
    }
  },
);
