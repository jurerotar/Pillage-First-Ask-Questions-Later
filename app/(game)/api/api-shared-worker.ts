import { matchRoute } from 'app/(game)/api/utils/route-matcher';
import type {
  ApiNotificationEvent,
  EventApiNotificationEvent,
  WorkerInitializationErrorEvent,
} from 'app/interfaces/api';
import { createDbFacade } from 'app/(game)/api/facades/database-facade';
import {
  cancelScheduling,
  scheduleNextEvent,
} from 'app/(game)/api/engine/scheduler';

const selfSW = self as unknown as SharedWorkerGlobalScope;

const sqlite3InitModule = (await import('@sqlite.org/sqlite-wasm')).default;

let initialized = false;
let serverSlug: string | null = null;
const ports: MessagePort[] = [];

interface OpfsSahPoolDb {
  exec: (sql: string) => void;
  close: () => void;
}

interface OpfsSahPool {
  OpfsSAHPoolDb: new (path: string) => OpfsSahPoolDb;
  pauseVfs: () => void;
}

interface Sqlite3ModuleLike {
  installOpfsSAHPoolVfs: (opts: {
    directory: string;
    forceReinitIfPreviouslyFailed?: boolean;
  }) => Promise<OpfsSahPool>;
}

// DB-related singletons
let opfsSahPool: OpfsSahPool | null = null;
let opfsDb: OpfsSahPoolDb | null = null;
let database: ReturnType<typeof createDbFacade> | null = null;

const initIfNeeded = async (search: string): Promise<void> => {
  if (initialized) {
    return;
  }
  const urlParams = new URLSearchParams(search);
  serverSlug = urlParams.get('server-slug');
  if (!serverSlug) {
    throw new Error('Missing server-slug for shared worker');
  }

  const sqlite3 = (await sqlite3InitModule()) as unknown as Sqlite3ModuleLike;
  opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
    directory: `/pillage-first-ask-questions-later/${serverSlug}`,
    forceReinitIfPreviouslyFailed: true,
  });
  opfsDb = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

  opfsDb.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA locking_mode = EXCLUSIVE;
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -20000;
    PRAGMA secure_delete = OFF;
    PRAGMA wal_autocheckpoint = 0;
  `);

  database = createDbFacade(opfsDb, false);
  scheduleNextEvent(database);
  initialized = true;
};

const broadcast = (message: unknown): void => {
  for (const port of ports) {
    try {
      port.postMessage(message);
    } catch {}
  }
};

type WorkerRequestMessage = {
  type: 'WORKER_MESSAGE';
  url: string;
  method: string;
  body: unknown;
};

type WorkerDisconnectMessage = { type: 'WORKER_DISCONNECT' };

type WorkerInboundMessage = WorkerRequestMessage | WorkerDisconnectMessage;

const isObject = (v: unknown): v is Record<string, unknown> => {
  return typeof v === 'object' && v !== null;
};

const isWorkerRequestMessage = (v: unknown): v is WorkerRequestMessage => {
  if (!isObject(v)) {
    return false;
  }
  return (
    v.type === 'WORKER_MESSAGE' &&
    typeof v.url === 'string' &&
    typeof v.method === 'string'
  );
};

const isWorkerDisconnectMessage = (
  v: unknown,
): v is WorkerDisconnectMessage => {
  return isObject(v) && v.type === 'WORKER_DISCONNECT';
};

const attachPortHandlers = (port: MessagePort): void => {
  port.addEventListener('message', (event: MessageEvent<unknown>) => {
    const { data } = event;

    if (isWorkerRequestMessage(data)) {
      try {
        const { url, method, body } = data;
        const { handler, params } = matchRoute(url, method);
        const result = (
          handler as (
            db: NonNullable<typeof database>,
            args: { params: Record<string, string>; body: unknown },
          ) => unknown
        )(database as NonNullable<typeof database>, {
          params,
          body,
        });

        if (method !== 'GET') {
          broadcast({
            eventKey: 'event:worker-event-creation-success',
            ...(isObject(body) ? body : {}),
            ...params,
          } satisfies EventApiNotificationEvent);
        }

        port.postMessage({ data: result });
      } catch (error) {
        console.error(error);
        broadcast({
          eventKey: 'event:worker-event-creation-error',
          ...(isObject((data as WorkerRequestMessage).body)
            ? (data as WorkerRequestMessage).body
            : {}),
        } satisfies EventApiNotificationEvent);
      }
      return;
    }

    if (isWorkerDisconnectMessage(data)) {
      try {
        port.close();
      } catch {}
      const idx = ports.indexOf(port);
      if (idx !== -1) {
        ports.splice(idx, 1);
      }
      if (ports.length === 0) {
        try {
          cancelScheduling();
          database?.close?.();
        } catch {}
        try {
          opfsDb?.close?.();
        } catch {}
        try {
          opfsSahPool?.pauseVfs?.();
        } catch {}
        initialized = false;
        database = null;
        opfsDb = null;
        opfsSahPool = null;
        serverSlug = null;
      }
      return;
    }
  });

  port.start();
  ports.push(port);

  port.postMessage({
    eventKey: 'event:worker-initialization-success',
  } satisfies ApiNotificationEvent);
};

try {
  selfSW.onconnect = async (evt: MessageEvent) => {
    const [port] = Array.from(evt.ports) as MessagePort[];
    await initIfNeeded(selfSW.location.search);
    attachPortHandlers(port);
  };
} catch (error) {
  console.error(error);
  selfSW.onconnect = (evt: MessageEvent) => {
    const [port] = Array.from(evt.ports) as MessagePort[];
    port.start();
    port.postMessage({
      eventKey: 'event:worker-initialization-error',
      error: error as Error,
    } satisfies WorkerInitializationErrorEvent);
  };
}
