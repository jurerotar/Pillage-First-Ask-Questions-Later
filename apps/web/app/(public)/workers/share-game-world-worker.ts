import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import {
  isFileSystemLockError,
  retryWhenFileSystemLocked,
} from '@pillage-first/utils/opfs-lock-retry';
import { toTransferableArrayBuffer } from 'app/(public)/workers/utils/array-buffer';

type ShareGameWorldWorkerResponse =
  | { type: 'database'; databaseBuffer: ArrayBuffer }
  | { type: 'error'; message: string };

const urlParams = new URLSearchParams(globalThis.location.search);
const serverSlug = urlParams.get('server-slug')!;

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;

try {
  const { default: sqlite3InitModule } = await import(
    '@sqlite.org/sqlite-wasm'
  );

  sqlite3 ??= await sqlite3InitModule();

  const opfsSahPoolOptions = {
    directory: `/pillage-first-ask-questions-later/${serverSlug}`,
    forceReinitIfPreviouslyFailed: true,
  };

  const initializedSqlite3 = sqlite3;

  opfsSahPool = await retryWhenFileSystemLocked(() =>
    initializedSqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions),
  );

  const fileName = `/${serverSlug}.sqlite3`;
  if (!opfsSahPool.getFileNames().includes(fileName)) {
    throw new Error(`Game world ${serverSlug} not found.`);
  }

  const exportedDb = await opfsSahPool.exportFile(fileName);
  const buffer = toTransferableArrayBuffer(exportedDb);

  globalThis.postMessage(
    {
      type: 'database',
      databaseBuffer: buffer,
    } satisfies ShareGameWorldWorkerResponse,
    [buffer],
  );
} catch (error) {
  console.error('[ShareGameWorldWorker] Export failed:', error);
  let message = 'Failed to prepare game world for sharing.';

  if (isFileSystemLockError(error)) {
    message =
      'The game world is already open on this device. Please close it before reattempting.';
  }

  globalThis.postMessage({
    type: 'error',
    message,
  } satisfies ShareGameWorldWorkerResponse);
} finally {
  opfsSahPool?.pauseVfs();
  opfsSahPool = null;

  globalThis.close();
}
