import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

export type ExportServerWorkerReturn = {
  databaseBuffer: ArrayBuffer;
};

const urlParams = new URLSearchParams(self.location.search);
const serverSlug = urlParams.get('server-slug')!;

const sqlite3 = await sqlite3InitModule({
  locateFile: () => sqliteWasmUrl,
});

const database = new sqlite3.oo1.OpfsDb(
  `/pillage-first-ask-questions-later/${serverSlug}.sqlite3`,
);

const byteArray: Uint8Array = sqlite3.capi.sqlite3_js_db_export(database);

const buffer: ArrayBuffer = byteArray.buffer as ArrayBuffer;

self.postMessage(
  { databaseBuffer: buffer } satisfies ExportServerWorkerReturn,
  [buffer],
);
