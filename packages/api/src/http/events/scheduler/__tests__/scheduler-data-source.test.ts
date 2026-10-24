import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { createTrapperCageProductionEventMock } from '@pillage-first/mocks/event';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import { insertEvents } from '../../../../utils/events';
import * as notifications from '../../../../worker/notification-port';
import { resolveEvent } from '../../resolve-event';
import {
  COMMIT_BATCH_SIZE,
  createSchedulerDataSource,
} from '../scheduler-data-source';

vi.mock('../../resolve-event', () => ({ resolveEvent: vi.fn() }));

const message = (
  id: number,
  eventKey: 'event:success' | 'event:error' = 'event:success',
): EventApiNotificationEvent => ({
  ...createTrapperCageProductionEventMock({
    id,
    villageId: 1,
    startsAt: 1000,
    duration: 1000,
  }),
  eventKey,
  affectedVillageIds: [],
  affectedTileIds: [],
});

const setup = async () => {
  const database = await prepareTestDatabase();

  database.exec({ sql: 'DELETE FROM events;' });

  database.exec({
    sql: 'CREATE TEMP TABLE resolved_events (id INTEGER PRIMARY KEY);',
  });

  const resolver = vi.mocked(resolveEvent);

  resolver.mockReset().mockImplementation((tx, id, notify) => {
    tx.exec({
      sql: 'INSERT INTO resolved_events VALUES ($id);',
      bind: { $id: id },
    });

    notify?.(message(id));
  });

  const post = vi
    .spyOn(notifications, 'postWorkerMessage')
    .mockImplementation(() => {});

  const source = createSchedulerDataSource(database);

  const resolvedIds = () =>
    database.selectValues({
      sql: 'SELECT id FROM resolved_events ORDER BY id;',
      schema: z.number(),
    });

  const failOn = (failedId: number, error: unknown) => {
    resolver.mockImplementation((tx, id, notify) => {
      tx.exec({
        sql: 'INSERT INTO resolved_events VALUES ($id);',
        bind: { $id: id },
      });

      notify?.(message(id, id === failedId ? 'event:error' : 'event:success'));

      if (id === failedId) {
        throw error;
      }
    });
  };

  return {
    database,
    source,
    resolver,
    post,
    resolvedIds,
    failOn,
    [Symbol.dispose]: () => {
      post.mockRestore();
      vi.restoreAllMocks();
      database.close();
    },
  };
};

test('getPastEventIds includes events due exactly now and excludes future events', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 0,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 2000,
      duration: 1000,
    }),
  ]);

  const ids = context.database.selectValues({
    sql: 'SELECT id FROM events ORDER BY id;',
    schema: z.number(),
  });

  expect(context.source.getPastEventIds(2000)).toStrictEqual(ids.slice(0, 2));
});

test('getPastEventIds orders by resolution time, then ID', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 2000,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
  ]);

  const [first, second, third] = context.database.selectValues({
    sql: 'SELECT id FROM events ORDER BY id;',
    schema: z.number(),
  });

  expect(context.source.getPastEventIds(3000)).toStrictEqual([
    second,
    third,
    first,
  ]);
});

test('getNextEvent returns the earliest strictly future event', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 2000,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 0,
      duration: 1000,
    }),
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
  ]);

  const id = context.database.selectValue({
    sql: 'SELECT id FROM events WHERE resolves_at = 2000;',
    schema: z.number(),
  });

  expect(context.source.getNextEvent(1000)).toStrictEqual({
    id,
    resolvesAt: 2000,
  });
});

test('getNextEvent returns null when no future event exists', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 0,
      duration: 1000,
    }),
  ]);

  expect(context.source.getNextEvent(1000)).toBeNull();
});

test('single-event resolution commits its changes', async () => {
  using context = await setup();

  context.source.resolveEvent(1);

  expect(context.resolvedIds()).toStrictEqual([1]);
});

test('single-event resolution rolls back resolver changes on failure', async () => {
  using context = await setup();

  context.failOn(1, new Error('Resolver failed'));

  expect(() => context.source.resolveEvent(1)).toThrow();
  expect(context.resolvedIds()).toStrictEqual([]);
});

test('single-event failure restores the deleted event', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
  ]);

  const [id] = context.source.getPastEventIds(2000);

  context.resolver.mockImplementation((tx, eventId) => {
    tx.exec({
      sql: 'DELETE FROM events WHERE id = $id;',
      bind: { $id: eventId },
    });

    throw new Error('Resolver failed');
  });

  expect(() => context.source.resolveEvent(id)).toThrow();
  expect(context.source.getPastEventIds(2000)).toStrictEqual([id]);
});

test('batch failure restores the deleted event', async () => {
  using context = await setup();

  insertEvents(context.database, [
    createTrapperCageProductionEventMock({
      villageId: 1,
      startsAt: 1000,
      duration: 1000,
    }),
  ]);

  const [id] = context.source.getPastEventIds(2000);

  context.resolver.mockImplementation((tx, eventId) => {
    tx.exec({
      sql: 'DELETE FROM events WHERE id = $id;',
      bind: { $id: eventId },
    });

    throw new Error('Resolver failed');
  });

  expect(() => context.source.resolveEvents([id])).toThrow();
  expect(context.source.getPastEventIds(2000)).toStrictEqual([id]);
});

test('an empty batch does not open a transaction', async () => {
  using context = await setup();
  const transaction = vi.spyOn(context.database, 'transaction');

  context.source.resolveEvents([]);

  expect(transaction).not.toHaveBeenCalled();
});

test.each([2, COMMIT_BATCH_SIZE - 1, COMMIT_BATCH_SIZE, COMMIT_BATCH_SIZE + 1])(
  '%i pending events commit in bounded batches without waiting for more events',
  async (count) => {
    using context = await setup();
    const transaction = vi.spyOn(context.database, 'transaction');

    context.source.resolveEvents(
      Array.from({ length: count }, (_, index) => index + 1),
    );

    expect(transaction).toHaveBeenCalledTimes(
      Math.ceil(count / COMMIT_BATCH_SIZE),
    );
    expect(context.resolvedIds()).toHaveLength(count);
  },
);

test('batch notifications are published only after commit', async () => {
  using context = await setup();
  const transaction = context.database.transaction;
  let committed = false;

  vi.spyOn(context.database, 'transaction').mockImplementation((callback) => {
    transaction(callback);
    committed = true;
  });

  context.post.mockImplementation(() => {
    expect(committed).toBe(true);
  });

  context.source.resolveEvents([1, 2]);

  expect(context.post).toHaveBeenCalledTimes(2);
});

test('publishes each batch before resolving the next batch', async () => {
  using context = await setup();
  const countAtDispatch: number[] = [];

  context.post.mockImplementation(() => {
    countAtDispatch.push(context.resolver.mock.calls.length);
  });

  context.source.resolveEvents(
    Array.from({ length: COMMIT_BATCH_SIZE + 1 }, (_, index) => index + 1),
  );

  expect(countAtDispatch).toStrictEqual([
    ...Array(COMMIT_BATCH_SIZE).fill(COMMIT_BATCH_SIZE),
    COMMIT_BATCH_SIZE + 1,
  ]);
});

test('publishes batch notifications in resolution order', async () => {
  using context = await setup();

  context.source.resolveEvents([3, 1, 2]);

  expect(
    context.post.mock.calls.map(([notification]) => notification),
  ).toStrictEqual([message(3), message(1), message(2)]);
});

test('consumes event IDs lazily between resolutions', async () => {
  using context = await setup();

  function* ids() {
    yield 1;

    if (context.resolvedIds().includes(1)) {
      yield 2;
    }
  }

  context.source.resolveEvents(ids());

  expect(context.resolvedIds()).toStrictEqual([1, 2]);
});

test('rolls back the failing event while retaining the successful prefix', async () => {
  using context = await setup();

  context.failOn(2, new Error('Resolver failed'));

  expect(() => context.source.resolveEvents([1, 2, 3])).toThrow();
  expect(context.resolvedIds()).toStrictEqual([1]);
});

test('stops resolving events after a failure', async () => {
  using context = await setup();

  context.failOn(2, new Error('Resolver failed'));

  expect(() => context.source.resolveEvents([1, 2, 3])).toThrow();
  expect(context.resolver.mock.calls.map(([, id]) => id)).toStrictEqual([1, 2]);
});

test('publishes the error notification after committing the successful prefix', async () => {
  using context = await setup();

  context.failOn(2, new Error('Resolver failed'));

  const transaction = context.database.transaction;
  let committed = false;

  vi.spyOn(context.database, 'transaction').mockImplementation((callback) => {
    transaction(callback);
    committed = true;
  });

  context.post.mockImplementation(() => {
    expect(committed).toBe(true);
  });

  expect(() => context.source.resolveEvents([1, 2])).toThrow();
  expect(
    context.post.mock.calls.map(([notification]) => notification),
  ).toStrictEqual([message(1), message(2, 'event:error')]);
});

test('rethrows the original batch resolution error', async () => {
  using context = await setup();
  const error = new Error('Resolver failed');

  context.failOn(1, error);

  expect(() => context.source.resolveEvents([1])).toThrow(error);
});

test('handles a resolver throwing undefined as a failure', async () => {
  using context = await setup();

  context.failOn(1, undefined);

  let threw = false;

  try {
    context.source.resolveEvents([1, 2]);
  } catch {
    threw = true;
  }

  expect(threw).toBe(true);
  expect(context.resolvedIds()).toStrictEqual([]);
});

test('a failed event can be retried without duplicating prior changes', async () => {
  using context = await setup();

  context.failOn(2, new Error('Resolver failed'));

  expect(() => context.source.resolveEvents([1, 2])).toThrow();

  context.failOn(-1, undefined);
  context.source.resolveEvents([2, 3]);

  expect(context.resolvedIds()).toStrictEqual([1, 2, 3]);
});

const abortTransaction = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
) => {
  const transaction = database.transaction;

  vi.spyOn(database, 'transaction').mockImplementation((callback) => {
    transaction((tx) => {
      callback(tx);
      throw new Error('Abort before commit');
    });
  });
};

test('an outer transaction failure rolls back the entire batch', async () => {
  using context = await setup();

  abortTransaction(context.database);

  expect(() => context.source.resolveEvents([1, 2])).toThrow(
    'Abort before commit',
  );
  expect(context.resolvedIds()).toStrictEqual([]);
});

test('an outer transaction failure discards queued notifications', async () => {
  using context = await setup();

  abortTransaction(context.database);

  expect(() => context.source.resolveEvents([1, 2])).toThrow();
  expect(context.post).not.toHaveBeenCalled();
});

test('a rejected commit discards queued notifications', async () => {
  using context = await setup();

  context.database.execMulti({
    sql: `
      PRAGMA foreign_keys = ON;
      CREATE TEMP TABLE parents (id INTEGER PRIMARY KEY);
      CREATE TEMP TABLE children (
        parent_id INTEGER REFERENCES parents(id) DEFERRABLE INITIALLY DEFERRED
      );
    `,
  });

  context.resolver.mockImplementation((tx, id, notify) => {
    tx.exec({ sql: 'INSERT INTO children VALUES (1);' });
    notify?.(message(id));
  });

  expect(() => context.source.resolveEvents([1])).toThrow(
    /FOREIGN KEY constraint failed/,
  );
  expect(context.post).not.toHaveBeenCalled();
});

test('a later batch failure retains previously committed batches', async () => {
  using context = await setup();

  context.failOn(COMMIT_BATCH_SIZE + 1, new Error('Resolver failed'));

  const ids = Array.from(
    { length: COMMIT_BATCH_SIZE + 1 },
    (_, index) => index + 1,
  );

  expect(() => context.source.resolveEvents(ids)).toThrow();
  expect(context.resolvedIds()).toStrictEqual(ids.slice(0, COMMIT_BATCH_SIZE));
});
