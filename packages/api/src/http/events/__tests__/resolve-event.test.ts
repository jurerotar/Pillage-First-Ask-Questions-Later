import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { createTrapperCageProductionEventMock } from '@pillage-first/mocks/event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { insertEvents } from '../../../utils/events';
import * as notifications from '../../../worker/notification-port';
import { resolveEvent } from '../resolve-event';
import { trapperCageProductionResolver } from '../resolvers/trapper-resolvers';

vi.mock('../resolvers/trapper-resolvers', () => ({
  trapperCageProductionResolver: vi.fn(),
}));

const setup = (database: DbFacade) => {
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

  return { event, resolver, notify };
};

test('does not call a resolver for a missing event', async () => {
  using database = await prepareTestDatabase();
  const { notify, resolver } = setup(database);
  resolveEvent(database, -1, notify);

  expect(resolver).not.toHaveBeenCalled();
});

test('does not notify for a missing event', async () => {
  using database = await prepareTestDatabase();
  const { notify } = setup(database);
  resolveEvent(database, -1, notify);

  expect(notify).not.toHaveBeenCalled();
});

test('passes the typed event to its resolver', async () => {
  using database = await prepareTestDatabase();
  const { event, notify, resolver } = setup(database);
  resolveEvent(database, event.id, notify);

  expect(resolver).toHaveBeenCalledExactlyOnceWith(database, event);
});

test('removes a resolved event from the queue', async () => {
  using database = await prepareTestDatabase();
  const { event, notify } = setup(database);
  resolveEvent(database, event.id, notify);

  expect(
    database.selectValue({
      sql: 'SELECT COUNT(*) FROM events;',
      schema: z.number(),
    }),
  ).toBe(0);
});

test('does not resolve the same event twice', async () => {
  using database = await prepareTestDatabase();
  const { event, notify, resolver } = setup(database);
  resolveEvent(database, event.id, notify);
  resolveEvent(database, event.id, notify);

  expect(resolver).toHaveBeenCalledOnce();
});

test('publishes the resolver affected villages and tiles on success', async () => {
  using database = await prepareTestDatabase();
  const { resolver, event, notify } = setup(database);
  resolver.mockReturnValue({
    affectedVillageIds: [1, 2],
    affectedTileIds: [3],
  });
  resolveEvent(database, event.id, notify);

  expect(notify).toHaveBeenCalledExactlyOnceWith({
    ...event,
    eventKey: 'event:success',
    affectedVillageIds: [1, 2],
    affectedTileIds: [3],
  });
});

test('uses the worker notification port when no notifier is supplied', async () => {
  using database = await prepareTestDatabase();
  const { event } = setup(database);
  using post = vi
    .spyOn(notifications, 'postWorkerMessage')
    .mockImplementation(() => {});
  resolveEvent(database, event.id);

  expect(post).toHaveBeenCalledExactlyOnceWith({
    ...event,
    eventKey: 'event:success',
    affectedVillageIds: [1],
    affectedTileIds: [],
  });
});

test('uses the supplied notifier instead of the worker port', async () => {
  using database = await prepareTestDatabase();
  const { event, notify } = setup(database);
  using post = vi
    .spyOn(notifications, 'postWorkerMessage')
    .mockImplementation(() => {});
  resolveEvent(database, event.id, notify);

  expect(post).not.toHaveBeenCalled();
});

test('publishes an error notification when the resolver fails', async () => {
  using database = await prepareTestDatabase();
  const { resolver, event, notify } = setup(database);
  resolver.mockImplementation(() => {
    throw new Error('Resolver failed');
  });

  expect(() => resolveEvent(database, event.id, notify)).toThrow();
  expect(notify).toHaveBeenCalledExactlyOnceWith({
    ...event,
    eventKey: 'event:error',
    affectedVillageIds: [],
    affectedTileIds: [],
  });
});

test('rethrows the original resolver error', async () => {
  using database = await prepareTestDatabase();
  const { resolver, event, notify } = setup(database);
  const error = new Error('Resolver failed');
  resolver.mockImplementation(() => {
    throw error;
  });

  expect(() => resolveEvent(database, event.id, notify)).toThrow(error);
});
