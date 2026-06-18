import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';

const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');

export type ExportServerWorkerReturn =
  | {
      resolved: true;
      databaseBuffer: ArrayBuffer;
    }
  | {
      resolved: false;
      error: string;
    };

const urlParams = new URLSearchParams(globalThis.location.search);
const serverSlug = urlParams.get('server-slug')!;

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;

try {
  sqlite3 ??= await sqlite3InitModule();

  const opfsSahPoolOptions = {
    directory: `/pillage-first-ask-questions-later/${serverSlug}`,
    forceReinitIfPreviouslyFailed: true,
  };

  const initializedSqlite3 = sqlite3;

  opfsSahPool = await retryWhenFileSystemLocked(() =>
    initializedSqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions),
  );

  const exportedDb = await opfsSahPool.exportFile(`/${serverSlug}.sqlite3`);

  const buffer: ArrayBuffer = exportedDb.buffer as ArrayBuffer;

  globalThis.postMessage(
    {
      resolved: true,
      databaseBuffer: buffer,
    } satisfies ExportServerWorkerReturn,
    [buffer],
  );
} catch (error) {
  globalThis.postMessage({
    resolved: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  } satisfies ExportServerWorkerReturn);
} finally {
  opfsSahPool?.pauseVfs();
}
