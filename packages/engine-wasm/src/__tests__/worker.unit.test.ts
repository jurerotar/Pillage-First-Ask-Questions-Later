import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// Keep transport/persistence tests independent of native compilation. The real
// OPFS and compiled engine are exercised by the browser and integration tests.
const mocks = vi.hoisted(() => {
  const engine = { dispatch: vi.fn(), snapshot: vi.fn(), close: vi.fn() };
  const raw = { pointer: 1, selectValue: vi.fn(), close: vi.fn() };
  const pool = {
    getFileCount: vi.fn(),
    getFileNames: vi.fn(),
    exportFile: vi.fn(),
    importDb: vi.fn(),
    unlink: vi.fn(),
    pauseVfs: vi.fn(),
    OpfsSAHPoolDb: vi.fn(),
  };
  const facade = { selectValue: vi.fn(), execMulti: vi.fn(), close: vi.fn() };
  return {
    engine,
    raw,
    pool,
    facade,
    createEngine: vi.fn(),
    sqliteInit: vi.fn(),
    install: vi.fn(),
    exportDb: vi.fn(),
    upgrade: vi.fn(),
    supported: vi.fn(),
  };
});

vi.mock('@sqlite.org/sqlite-wasm', () => ({ default: mocks.sqliteInit }));
vi.mock('@pillage-first/db', () => ({ upgradeDb: mocks.upgrade }));
vi.mock('@pillage-first/utils/facades/database', () => ({
  createDbFacade: () => mocks.facade,
}));
vi.mock('@pillage-first/utils/env', () => ({ env: { VERSION: '0.4.73' } }));
vi.mock('@pillage-first/utils/version', () => ({
  isSupportedDatabaseUserVersion: mocks.supported,
}));
vi.mock('@pillage-first/utils/opfs-lock-retry', () => ({
  retryWhenFileSystemLocked: (fn: () => unknown) => fn(),
}));
vi.mock('../client', () => ({ createEngine: mocks.createEngine }));
vi.mock('../../build/engine.mjs', () => ({ default: vi.fn() }));

let listener: (event: MessageEvent) => Promise<void>;
let notificationPort: ReturnType<typeof port>;
let files: Map<string, Uint8Array>;
const image = new Uint8Array([1, 2, 3]);
const main = '/world.sqlite3';
const backup = '/world.wasm-save-backup.sqlite3';
const result = { data: { ok: true }, notifications: [], nextDeadline: null };

const port = () => {
  return { start: vi.fn(), postMessage: vi.fn(), close: vi.fn() };
};

const send = async (type: string, data = {}, ports: unknown[] = []) => {
  await listener({ data: { type, ...data }, ports } as unknown as MessageEvent);
};

const init = async () => {
  await send('WORKER_INIT', {}, [notificationPort]);
};

const request = async (url = '/server', method = 'GET') => {
  const reply = port();
  await send('WORKER_MESSAGE', { url, method }, [reply]);
  return reply;
};

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(1_700_000_000_000);
  vi.stubGlobal('location', { search: '?server-slug=world' });
  vi.stubGlobal(
    'addEventListener',
    (_name: string, handler: typeof listener) => {
      listener = handler;
    },
  );
  notificationPort = port();
  files = new Map([[main, image]]);
  mocks.pool.getFileCount.mockImplementation(() => files.size);
  mocks.pool.getFileNames.mockImplementation(() => [...files.keys()]);
  mocks.pool.exportFile.mockImplementation(async (name) => files.get(name));
  mocks.pool.importDb.mockImplementation(async (name, bytes) => {
    files.set(name, bytes.slice());
  });
  mocks.pool.unlink.mockImplementation((name) => files.delete(name));
  // biome-ignore lint/complexity/useArrowFunction: SQLite invokes this mock with new.
  mocks.pool.OpfsSAHPoolDb.mockImplementation(function () {
    return mocks.raw;
  });
  mocks.raw.selectValue.mockReturnValue('ok');
  mocks.facade.selectValue.mockReturnValue(4073);
  mocks.supported.mockReturnValue(true);
  mocks.exportDb.mockReturnValue(image);
  mocks.install.mockResolvedValue(mocks.pool);
  mocks.sqliteInit.mockResolvedValue({
    installOpfsSAHPoolVfs: mocks.install,
    capi: { sqlite3_js_db_export: mocks.exportDb },
  });
  mocks.createEngine.mockResolvedValue(mocks.engine);
  mocks.engine.dispatch.mockReturnValue(result);
  mocks.engine.snapshot.mockReturnValue(image);
  await import('./fixtures/browser-worker');
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('opens/migrates the world before advancing and forces the ready notification', async () => {
  await init();
  expect(mocks.upgrade).toHaveBeenCalledWith(mocks.facade, 4073);
  expect(mocks.raw.close).toHaveBeenCalled();
  expect(mocks.facade.close).toHaveBeenCalled();
  expect(mocks.createEngine).toHaveBeenCalledWith(image, expect.any(Function));
  expect(mocks.engine.dispatch).toHaveBeenCalledWith({
    type: 'advance',
    now: Date.now(),
    limit: 1000,
    notifications: false,
  });
  expect(notificationPort.postMessage).toHaveBeenCalledWith({
    eventKey: 'event:database-initialization-success',
  });
});

test.each([
  'missing world',
  'unsupported version',
  'missing slug',
  'missing port',
])('cleans up failed initialization: %s', async (failure) => {
  if (failure === 'missing world') {
    files.clear();
  }
  if (failure === 'unsupported version') {
    mocks.supported.mockReturnValue(false);
  }
  if (failure === 'missing slug') {
    vi.stubGlobal('location', { search: '' });
  }
  await send(
    'WORKER_INIT',
    {},
    failure === 'missing port' ? [] : [notificationPort],
  );
  expect(mocks.createEngine).not.toHaveBeenCalled();
  if (failure !== 'missing port') {
    expect(notificationPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'event:database-initialization-error',
      }),
    );
  }
  if (failure === 'unsupported version') {
    expect(mocks.raw.close).toHaveBeenCalled();
    expect(mocks.facade.close).toHaveBeenCalled();
    expect(mocks.pool.pauseVfs).toHaveBeenCalled();
  }
});

test.each(['ok', 'corrupt', 'unreadable'])(
  'recovers interrupted saves when the main image is %s',
  async (integrity) => {
    const oldImage = new Uint8Array([9, 8]);
    files.set(backup, oldImage);
    mocks.raw.selectValue.mockImplementation(() => {
      if (integrity === 'unreadable') {
        throw new Error('corrupt');
      }
      return integrity;
    });
    await init();
    expect(files.has(backup)).toBe(false);
    expect(files.get(main)).toEqual(integrity === 'ok' ? image : oldImage);
  },
);

test('routes responses and toggles notifications without suppressing readiness', async () => {
  await init();
  notificationPort.postMessage.mockClear();
  const notification = { eventKey: 'event:success' };
  mocks.engine.dispatch.mockReturnValue({
    ...result,
    notifications: [notification],
  });
  await send('WORKER_START_NOTIFICATION_POSTING');
  const reply = await request();
  expect(reply.postMessage).toHaveBeenCalledWith({ data: result.data });
  expect(reply.close).toHaveBeenCalledOnce();
  expect(notificationPort.postMessage).toHaveBeenCalledWith(notification);
  await send('WORKER_STOP_NOTIFICATION_POSTING');
  notificationPort.postMessage.mockClear();
  await request();
  expect(notificationPort.postMessage).not.toHaveBeenCalled();
  expect(mocks.engine.dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ notifications: false }),
  );
});

test('exports a database image as a transferable without routing it through controllers', async () => {
  await init();
  mocks.engine.dispatch.mockClear();
  const reply = await request('/server/database');
  expect(reply.postMessage).toHaveBeenCalledWith({ data: image }, [
    image.buffer,
  ]);
  expect(mocks.engine.dispatch).not.toHaveBeenCalled();
});

test('reports request errors and always closes the reply port', async () => {
  const unavailable = await request();
  expect(unavailable.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ eventKey: 'event:error' }),
  );
  expect(unavailable.close).toHaveBeenCalledOnce();
  await init();
  mocks.engine.dispatch.mockImplementation(() => {
    throw new Error('constraint failed');
  });
  const failed = await request();
  expect(failed.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ eventKey: 'event:error' }),
  );
  expect(failed.close).toHaveBeenCalledOnce();
});

test('saves dirty state periodically and skips subsequent clean ticks', async () => {
  await init();
  await vi.advanceTimersByTimeAsync(5000);
  expect(files.has(backup)).toBe(false);
  expect(mocks.pool.importDb).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(5000);
  expect(mocks.pool.importDb).toHaveBeenCalledTimes(2);
});

test('close retries a failed save without discarding the live engine', async () => {
  await init();
  mocks.pool.importDb.mockRejectedValueOnce(new Error('disk full'));
  await send('WORKER_CLOSE');
  expect(mocks.engine.close).not.toHaveBeenCalled();
  expect(mocks.pool.pauseVfs).not.toHaveBeenCalled();
  expect(notificationPort.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ eventKey: 'event:error' }),
  );
  expect((await request()).postMessage).toHaveBeenCalledWith({
    data: result.data,
  });
  await send('WORKER_CLOSE');
  expect(mocks.engine.close).toHaveBeenCalledOnce();
  expect(mocks.pool.pauseVfs).toHaveBeenCalledOnce();
  expect(notificationPort.postMessage).toHaveBeenLastCalledWith({
    type: 'WORKER_CLOSE_SUCCESS',
  });
  expect(vi.getTimerCount()).toBe(0);
});

test('a failed close resumes scheduler wakeups and autosave', async () => {
  mocks.engine.dispatch.mockReturnValue({
    ...result,
    nextDeadline: Date.now() + 100,
  });
  await init();
  mocks.pool.importDb.mockRejectedValueOnce(new Error('disk full'));
  await send('WORKER_CLOSE');
  mocks.engine.dispatch.mockReturnValue(result);
  await vi.advanceTimersByTimeAsync(100);
  expect(mocks.engine.dispatch).toHaveBeenCalledTimes(2);
  expect(mocks.engine.dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'advance' }),
  );
  await vi.advanceTimersByTimeAsync(4900);
  expect(files.has(backup)).toBe(false);
  expect(mocks.pool.importDb).toHaveBeenCalledTimes(3);
  await send('WORKER_CLOSE');
  expect(vi.getTimerCount()).toBe(0);
});

test('close flushes revisions made while an earlier autosave was in flight', async () => {
  await init();
  let finishSave!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishSave = resolve;
  });
  const importDb = mocks.pool.importDb.getMockImplementation()!;
  let held = false;
  mocks.pool.importDb.mockImplementation(async (name, bytes) => {
    if (name === main && !held) {
      held = true;
      await pending;
    }
    return importDb(name, bytes);
  });
  await vi.advanceTimersByTimeAsync(5000);
  expect(held).toBe(true);
  const updated = new Uint8Array([4, 5, 6]);
  mocks.engine.snapshot.mockReturnValue(updated);
  await request('/developer-settings', 'PATCH');
  const close = send('WORKER_CLOSE');
  expect(mocks.engine.close).not.toHaveBeenCalled();
  finishSave();
  await close;
  expect(files.get(main)).toEqual(updated);
  expect(
    mocks.pool.importDb.mock.calls.filter(([name]) => name === main),
  ).toHaveLength(2);
  expect(mocks.engine.close).toHaveBeenCalledOnce();
});

test('schedules due batches and cancels wakeups on close', async () => {
  mocks.engine.dispatch.mockReturnValue({
    ...result,
    nextDeadline: Date.now() + 100,
  });
  await init();
  mocks.engine.dispatch.mockReturnValue(result);
  await vi.advanceTimersByTimeAsync(100);
  expect(mocks.engine.dispatch).toHaveBeenCalledTimes(2);
  expect(mocks.engine.dispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'advance', now: Date.now() }),
  );
  await send('WORKER_CLOSE');
  await vi.advanceTimersByTimeAsync(5000);
  expect(mocks.engine.dispatch).toHaveBeenCalledTimes(2);
});

test('a failed initial batch releases resources and close still completes', async () => {
  mocks.engine.dispatch.mockImplementation(() => {
    throw new Error('batch failed');
  });
  await init();
  expect(mocks.engine.close).toHaveBeenCalledOnce();
  expect(mocks.pool.pauseVfs).toHaveBeenCalledOnce();
  await send('WORKER_CLOSE');
  expect(notificationPort.postMessage).toHaveBeenLastCalledWith({
    type: 'WORKER_CLOSE_SUCCESS',
  });
});

test('autosave failure reports an error and retains the backup for retry', async () => {
  await init();
  const original = mocks.pool.importDb.getMockImplementation()!;
  mocks.pool.importDb.mockImplementation(async (name, bytes) => {
    if (name === main) {
      throw new Error('disk full');
    }
    return original(name, bytes);
  });
  await vi.advanceTimersByTimeAsync(5000);
  expect(files.get(backup)).toEqual(image);
  expect(notificationPort.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ eventKey: 'event:error' }),
  );
  mocks.pool.importDb.mockImplementation(original);
  await send('WORKER_CLOSE');
  expect(files.has(backup)).toBe(false);
  expect(mocks.engine.close).toHaveBeenCalledOnce();
});

test('missing reply ports report a notification without an unhandled error', async () => {
  await init();
  await expect(
    send('WORKER_MESSAGE', { url: '/server', method: 'GET' }),
  ).resolves.toBeUndefined();
  expect(notificationPort.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ eventKey: 'event:error' }),
  );
});

test.each([
  [-100, 0],
  [3_000_000_000, 2_147_483_647],
])('clamps a deadline offset of %d to %d ms', async (offset, expected) => {
  const timer = vi.spyOn(globalThis, 'setTimeout');
  mocks.engine.dispatch.mockReturnValue({
    ...result,
    nextDeadline: Date.now() + offset,
  });
  await init();
  expect(timer).toHaveBeenCalledWith(expect.any(Function), expected);
  await send('WORKER_CLOSE');
  timer.mockRestore();
});
