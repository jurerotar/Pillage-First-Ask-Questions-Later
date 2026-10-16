import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTrapperCageProductionEventMock } from '@pillage-first/mocks/event';
import { insertEvents } from '../../../utils/events';
import * as notifications from '../../../worker/notification-port';
import { resolveEvent } from '../resolve-event';
import { trapperCageProductionResolver } from '../resolvers/trapper-resolvers';

vi.mock('../resolvers/trapper-resolvers', () => ({
  trapperCageProductionResolver: vi.fn(),
}));

const setup = async () => {
  const database = await prepareTestDatabase();
  database.exec({ sql: 'DELETE FROM events;' });
  const event = createTrapperCageProductionEventMock({
    id: 0,
    startsAt: 1000,
    duration: 1000,
    villageId: 1,
    cageAmount: 4,
  });
  insertEvents(database, [event]);
  event.id = database.selectValue({
    sql: 'SELECT id FROM events;',
    schema: z.number(),
  })!;
  const resolver = vi.mocked(trapperCageProductionResolver);
  resolver
    .mockReset()
    .mockReturnValue({ affectedVillageIds: [1], affectedTileIds: [] });
  const notify = vi.fn();
  const post = vi
    .spyOn(notifications, 'postWorkerMessage')
    .mockImplementation(() => {});
  return {
    database,
    event,
    resolver,
    notify,
    post,
    [Symbol.dispose]: () => {
      post.mockRestore();
      database.close();
    },
  };
};

test('does not call a resolver for a missing event', async () => {
  using context = await setup();
  resolveEvent(context.database, -1, context.notify);

  expect(context.resolver).not.toHaveBeenCalled();
});

test('does not notify for a missing event', async () => {
  using context = await setup();
  resolveEvent(context.database, -1, context.notify);

  expect(context.notify).not.toHaveBeenCalled();
});

test('passes the typed event to its resolver', async () => {
  using context = await setup();
  resolveEvent(context.database, context.event.id, context.notify);

  expect(context.resolver).toHaveBeenCalledExactlyOnceWith(
    context.database,
    context.event,
  );
});

test('removes a resolved event from the queue', async () => {
  using context = await setup();
  resolveEvent(context.database, context.event.id, context.notify);

  expect(
    context.database.selectValue({
      sql: 'SELECT COUNT(*) FROM events;',
      schema: z.number(),
    }),
  ).toBe(0);
});

test('does not resolve the same event twice', async () => {
  using context = await setup();
  resolveEvent(context.database, context.event.id, context.notify);
  resolveEvent(context.database, context.event.id, context.notify);

  expect(context.resolver).toHaveBeenCalledOnce();
});

test('publishes the resolver affected villages and tiles on success', async () => {
  using context = await setup();
  context.resolver.mockReturnValue({
    affectedVillageIds: [1, 2],
    affectedTileIds: [3],
  });
  resolveEvent(context.database, context.event.id, context.notify);

  expect(context.notify).toHaveBeenCalledExactlyOnceWith({
    ...context.event,
    eventKey: 'event:success',
    affectedVillageIds: [1, 2],
    affectedTileIds: [3],
  });
});

test('uses the worker notification port when no notifier is supplied', async () => {
  using context = await setup();
  resolveEvent(context.database, context.event.id);

  expect(context.post).toHaveBeenCalledExactlyOnceWith({
    ...context.event,
    eventKey: 'event:success',
    affectedVillageIds: [1],
    affectedTileIds: [],
  });
});

test('uses the supplied notifier instead of the worker port', async () => {
  using context = await setup();
  resolveEvent(context.database, context.event.id, context.notify);

  expect(context.post).not.toHaveBeenCalled();
});

test('publishes an error notification when the resolver fails', async () => {
  using context = await setup();
  context.resolver.mockImplementation(() => {
    throw new Error('Resolver failed');
  });

  expect(() =>
    resolveEvent(context.database, context.event.id, context.notify),
  ).toThrow();
  expect(context.notify).toHaveBeenCalledExactlyOnceWith({
    ...context.event,
    eventKey: 'event:error',
    affectedVillageIds: [],
    affectedTileIds: [],
  });
});

test('rethrows the original resolver error', async () => {
  using context = await setup();
  const error = new Error('Resolver failed');
  context.resolver.mockImplementation(() => {
    throw error;
  });

  expect(() =>
    resolveEvent(context.database, context.event.id, context.notify),
  ).toThrow(error);
});
