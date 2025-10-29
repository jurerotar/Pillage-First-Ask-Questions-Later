import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export type ExportServerWorkerReturn = {
  databaseBuffer: ArrayBuffer;
};

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

const sqlite3 = await sqlite3InitModule();

const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
  directory: `/pillage-first-ask-questions-later/${serverSlug}`,
});

const exportedDb = await opfsSahPool.exportFile(`/${serverSlug}.sqlite3`);

const buffer: ArrayBuffer = exportedDb.buffer as ArrayBuffer;

self.postMessage(
  { databaseBuffer: buffer } satisfies ExportServerWorkerReturn,
  [buffer],
);
