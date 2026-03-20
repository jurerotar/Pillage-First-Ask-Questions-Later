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

    try {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );
      const sqlite3 = await sqlite3InitModule();

      const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
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
      globalThis.close();
    } catch (error) {
      console.error(error);
      globalThis.postMessage({
        type: 'error',
        message: 'Failed to prepare game world for sharing.',
      } satisfies ShareServerWorkerResponse);
      globalThis.close();
    }
  },
);
