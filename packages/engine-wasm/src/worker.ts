import sqlite3InitModule, { type SAHPoolUtil } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { upgradeDb } from '@pillage-first/db';
import { env } from '@pillage-first/utils/env';
import {
  OutdatedDatabaseSchemaError,
  serializeError,
} from '@pillage-first/utils/errors';
import { createDbFacade } from '@pillage-first/utils/facades/database';
import { retryWhenFileSystemLocked } from '@pillage-first/utils/opfs-lock-retry';
import { isSupportedDatabaseUserVersion } from '@pillage-first/utils/version';
import createGameEngine from '../build/engine.mjs';
import { createEngine, type EngineResponse, type WasmModule } from './client';

let engine: Awaited<ReturnType<typeof createEngine>> | null = null;
let pool: SAHPoolUtil | null = null;
let notificationPort: MessagePort | null = null;
let postNotifications = false;
let filename = '';
let backupFilename = '';
let dirty = false;
let revision = 0;
let activeSave: Promise<void> | null = null;
let closing = false;
let wakeup: ReturnType<typeof setTimeout> | null = null;
let saveInterval: ReturnType<typeof setInterval> | null = null;

function persist(): Promise<void> {
  if (activeSave) {
    return activeSave;
  }
  if (!engine || !pool || !dirty) {
    return Promise.resolve();
  }
  const image = engine.snapshot();
  const saveRevision = revision;
  const savePool = pool;
  activeSave = (async () => {
    // Keep a recoverable previous image until the replacement is fully written.
    if (!savePool.getFileNames().includes(backupFilename)) {
      await savePool.importDb(
        backupFilename,
        await savePool.exportFile(filename),
      );
    }
    await savePool.importDb(filename, image);
    savePool.unlink(backupFilename);
    dirty = revision !== saveRevision;
  })().finally(() => {
    activeSave = null;
  });
  return activeSave;
}
function notify(message: unknown, force = false) {
  if (force || postNotifications) {
    notificationPort?.postMessage(message);
  }
}
function schedule(result: EngineResponse) {
  for (const notification of result.notifications) {
    notify(notification);
  }
  if (wakeup !== null) {
    clearTimeout(wakeup);
  }
  wakeup = null;
  if (result.nextDeadline !== null) {
    wakeup = setTimeout(
      () => {
        if (!engine || closing) {
          return;
        }
        try {
          dirty = true;
          revision++;
          schedule(
            engine.dispatch({
              type: 'advance',
              now: Date.now(),
              limit: 1000,
              notifications: postNotifications,
            }),
          );
        } catch (error) {
          notify(
            { eventKey: 'event:error', error: serializeError(error) },
            true,
          );
        }
      },
      Math.min(2_147_483_647, Math.max(0, result.nextDeadline - Date.now())),
    );
  }
}
function release() {
  if (wakeup !== null) {
    clearTimeout(wakeup);
  }
  if (saveInterval !== null) {
    clearInterval(saveInterval);
  }
  wakeup = saveInterval = null;
  engine?.close();
  engine = null;
  pool?.pauseVfs();
  pool = null;
}

globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { type } = event.data;
  if (type === 'WORKER_INIT') {
    try {
      notificationPort = event.ports[0];
      if (!notificationPort) {
        throw new Error('Missing notification port');
      }
      notificationPort.start();
      const slug = new URLSearchParams(globalThis.location.search).get(
        'server-slug',
      );
      if (!slug) {
        throw new Error('Missing server slug');
      }
      filename = `/${slug}.sqlite3`;
      backupFilename = `/${slug}.wasm-save-backup.sqlite3`;
      const sqlite = await sqlite3InitModule();
      const poolOptions = {
        directory: `/pillage-first-ask-questions-later/${slug}`,
        forceReinitIfPreviouslyFailed: true,
      };
      pool = await retryWhenFileSystemLocked(() =>
        sqlite.installOpfsSAHPoolVfs(poolOptions),
      );
      if (pool.getFileCount() === 0) {
        throw new OutdatedDatabaseSchemaError();
      }
      if (pool.getFileNames().includes(backupFilename)) {
        let valid = false;
        let checkDb: InstanceType<typeof pool.OpfsSAHPoolDb> | null = null;
        try {
          checkDb = new pool.OpfsSAHPoolDb(filename);
          valid = checkDb.selectValue('PRAGMA integrity_check') === 'ok';
        } catch {
          /* Restore the last complete save below. */
        } finally {
          checkDb?.close();
        }
        if (!valid) {
          await pool.importDb(filename, await pool.exportFile(backupFilename));
        }
        pool.unlink(backupFilename);
      }
      const raw = new pool.OpfsSAHPoolDb(filename);
      const facade = createDbFacade(raw);
      let bytes: Uint8Array;
      try {
        const version = facade.selectValue({
          sql: 'PRAGMA user_version',
          schema: z.number(),
        })!;
        if (!isSupportedDatabaseUserVersion(version, env.VERSION)) {
          throw new OutdatedDatabaseSchemaError();
        }
        upgradeDb(facade, version);
        facade.execMulti({
          sql: 'PRAGMA locking_mode=EXCLUSIVE; PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=DELETE;',
        });
        bytes = sqlite.capi.sqlite3_js_db_export(raw.pointer!, 'main');
      } finally {
        facade.close();
        raw.close();
      }
      engine = await createEngine(
        bytes,
        () => createGameEngine() as Promise<WasmModule>,
      );
      dirty = true;
      revision++;
      schedule(
        engine.dispatch({
          type: 'advance',
          now: Date.now(),
          limit: 1000,
          notifications: false,
        }),
      );
      saveInterval = setInterval(() => {
        void persist().catch((error) =>
          notify(
            { eventKey: 'event:error', error: serializeError(error) },
            true,
          ),
        );
      }, 5000);
      notify({ eventKey: 'event:database-initialization-success' }, true);
    } catch (error) {
      release();
      notify(
        {
          eventKey: 'event:database-initialization-error',
          error: serializeError(error),
        },
        true,
      );
    }
    return;
  }
  if (type === 'WORKER_START_NOTIFICATION_POSTING') {
    postNotifications = true;
    return;
  }
  if (type === 'WORKER_STOP_NOTIFICATION_POSTING') {
    postNotifications = false;
    return;
  }
  if (type === 'WORKER_MESSAGE') {
    const port = event.ports[0];
    try {
      if (!engine || closing) {
        throw new Error('Game engine is not available');
      }
      if (
        event.data.url === '/server/database' &&
        (event.data.method ?? 'GET').toUpperCase() === 'GET'
      ) {
        const bytes = engine.snapshot();
        port.postMessage({ data: bytes }, [bytes.buffer]);
      } else {
        dirty = true;
        revision++;
        const response = engine.dispatch({
          type: 'request',
          url: event.data.url,
          method: event.data.method,
          body: event.data.body,
          notifications: postNotifications,
        });
        schedule(response);
        port.postMessage({ data: response.data });
      }
    } catch (error) {
      const message = { eventKey: 'event:error', error: serializeError(error) };
      port.postMessage(message);
      notify(message);
    } finally {
      port.close();
    }
    return;
  }
  if (type === 'WORKER_CLOSE') {
    try {
      closing = true;
      if (wakeup !== null) {
        clearTimeout(wakeup);
      }
      if (saveInterval !== null) {
        clearInterval(saveInterval);
      }
      do {
        await persist();
      } while (dirty);
      release();
      notify({ type: 'WORKER_CLOSE_SUCCESS' }, true);
    } catch (error) {
      closing = false;
      // Keep the live engine available if saving fails; a retry must retain its state.
      notify({ eventKey: 'event:error', error: serializeError(error) }, true);
    }
  }
});
