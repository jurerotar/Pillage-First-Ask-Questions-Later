import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

export type ExportServerWorkerReturn = {
  databaseBuffer: ArrayBuffer;
};

const urlParams = new URLSearchParams(globalThis.location.search);
const serverSlug = urlParams.get('server-slug')!;

const sqlite3 = await sqlite3InitModule({
  locateFile: () => sqliteWasmUrl,
});

const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
  directory: `/pillage-first-ask-questions-later/${serverSlug}`,
});

const exportedDb = await opfsSahPool.exportFile(`/${serverSlug}.sqlite3`);

const buffer: ArrayBuffer = exportedDb.buffer as ArrayBuffer;

globalThis.postMessage(
  { databaseBuffer: buffer } satisfies ExportServerWorkerReturn,
  [buffer],
);
