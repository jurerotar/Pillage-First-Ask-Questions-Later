import { afterEach, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  createTestVillage,
  prepareTestDatabase,
  setTestBuildingLevel,
  setTestDeveloperSetting,
} from '@pillage-first/api/testing';
import {
  ANIMAL_CAGE_COST,
  ANIMAL_CAGE_ITEM_ID,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import { TRAPPER_CAGE_COST } from '@pillage-first/game-assets/utils/trapper';
import { createEventDtoSchema } from '@pillage-first/types/dtos/event';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createSchedulerDataSource } from '../../http/events/scheduler/scheduler-data-source';
import { createEvents } from '../create-event';

const NOW = 1_000_000;
const types = ['animalCageProduction', 'trapperCageProduction'] as const;

afterEach(() => vi.useRealTimers());

const setup = async (type: (typeof types)[number]) => {
  const database = await prepareTestDatabase();

  const village = createTestVillage(database, 'Cage Production', {
    resourceSite: {
      resources: { wood: 800, clay: 800, iron: 800, wheat: 800 },
      updatedAt: NOW,
    },
  });

  database.exec({ sql: 'DELETE FROM events;' });
  database.exec({ sql: 'DELETE FROM trapper_cages;' });
  database.exec({
    sql: 'DELETE FROM hero_inventory WHERE item_id = $item;',
    bind: { $item: ANIMAL_CAGE_ITEM_ID },
  });
  database.exec({ sql: 'UPDATE servers SET speed = 2;' });

  setTestBuildingLevel(
    database,
    village.id,
    type === 'animalCageProduction' ? 'HUNTERS_LODGE' : 'TRAPPER',
    2,
    32,
  );

  setTestDeveloperSetting(database, 'is_free_unit_training_enabled', 0);
  setTestDeveloperSetting(database, 'is_instant_unit_training_enabled', 0);

  vi.useFakeTimers();
  vi.setSystemTime(NOW);

  return { database, village };
};

const produced = (database: DbFacade, type: (typeof types)[number]) =>
  database.selectValue({
    sql:
      type === 'trapperCageProduction'
        ? 'SELECT COUNT(*) FROM trapper_cages;'
        : `
          SELECT COALESCE(SUM(amount), 0)
          FROM hero_inventory
          WHERE item_id = $item;
        `,
    bind:
      type === 'animalCageProduction'
        ? { $item: ANIMAL_CAGE_ITEM_ID }
        : undefined,
    schema: z.number(),
  })!;

test.each(types)(
  '%s charges once and resolves one cage at each production interval',
  async (type) => {
    const { database, village } = await setup(type);

    using db = database;

    db.transaction((tx) =>
      createEvents<typeof type>(tx, {
        type,
        villageId: village.id,
        amount: 2,
        batchId: 'first',
      }),
    );

    const queue = db.selectObjects({
      sql: `
        SELECT
          id,
          starts_at,
          duration,
          resolves_at,
          JSON_EXTRACT(meta, '$.batchId') AS batchId
        FROM events
        ORDER BY resolves_at, id;
      `,
      schema: z.strictObject({
        id: z.number(),
        starts_at: z.number(),
        duration: z.number(),
        resolves_at: z.number(),
        batchId: z.string(),
      }),
    });

    expect(
      queue.map(({ starts_at, duration, resolves_at, batchId }) => ({
        starts_at,
        duration,
        resolves_at,
        batchId,
      })),
    ).toStrictEqual([
      {
        starts_at: NOW,
        duration: 300_000,
        resolves_at: NOW + 300_000,
        batchId: 'first',
      },
      {
        starts_at: NOW + 300_000,
        duration: 300_000,
        resolves_at: NOW + 600_000,
        batchId: 'first',
      },
    ]);

    const [wood, clay, iron, wheat] = (
      type === 'animalCageProduction' ? ANIMAL_CAGE_COST : TRAPPER_CAGE_COST
    ).map((cost) => 800 - 2 * cost);

    expect(
      db.selectObject({
        sql: `
          SELECT wood, clay, iron, wheat
          FROM resource_sites
          WHERE tile_id = $tile;
        `,
        bind: { $tile: village.tileId },
        schema: resourcesSchema,
      }),
    ).toStrictEqual({ wood, clay, iron, wheat });

    const scheduler = createSchedulerDataSource(db);

    scheduler.resolveEvent(queue[0].id);

    expect(produced(db, type)).toBe(1);
    expect(
      db.selectValue({
        sql: 'SELECT COUNT(*) FROM events;',
        schema: z.number(),
      }),
    ).toBe(1);

    scheduler.resolveEvent(queue[1].id);

    expect(produced(db, type)).toBe(2);
    expect(
      db.selectValue({
        sql: 'SELECT COUNT(*) FROM events;',
        schema: z.number(),
      }),
    ).toBe(0);
  },
);

test.each(types)(
  '%s appends batches and supports free instant production',
  async (type) => {
    const { database, village } = await setup(type);

    using db = database;

    setTestDeveloperSetting(db, 'is_free_unit_training_enabled', 1);

    createEvents<typeof type>(db, {
      type,
      villageId: village.id,
      amount: 2,
      batchId: 'first',
    });

    createEvents<typeof type>(db, {
      type,
      villageId: village.id,
      amount: 1,
      batchId: 'second',
    });

    expect(
      db.selectValues({
        sql: 'SELECT resolves_at FROM events ORDER BY resolves_at, id;',
        schema: z.number(),
      }),
    ).toStrictEqual([NOW + 300_000, NOW + 600_000, NOW + 900_000]);

    db.exec({ sql: 'DELETE FROM events;' });

    setTestDeveloperSetting(db, 'is_instant_unit_training_enabled', 1);

    createEvents<typeof type>(db, {
      type,
      villageId: village.id,
      amount: 3,
      batchId: 'instant',
    });

    const scheduler = createSchedulerDataSource(db);
    const ids = scheduler.getPastEventIds(NOW);

    expect(ids).toHaveLength(3);

    scheduler.resolveEvents(ids);

    expect(produced(db, type)).toBe(3);
    expect(
      db.selectObject({
        sql: `
          SELECT wood, clay, iron, wheat
          FROM resource_sites
          WHERE tile_id = $tile;
        `,
        bind: { $tile: village.tileId },
        schema: resourcesSchema,
      }),
    ).toStrictEqual({ wood: 800, clay: 800, iron: 800, wheat: 800 });
  },
);

test('trapper capacity counts remaining events, not the original batch amount on each event', async () => {
  const { database, village } = await setup('trapperCageProduction');

  using db = database;

  setTestDeveloperSetting(db, 'is_free_unit_training_enabled', 1);
  setTestBuildingLevel(db, village.id, 'TRAPPER', 1, 32);

  createEvents<'trapperCageProduction'>(db, {
    type: 'trapperCageProduction',
    villageId: village.id,
    amount: 6,
    batchId: 'six',
  });

  createEvents<'trapperCageProduction'>(db, {
    type: 'trapperCageProduction',
    villageId: village.id,
    amount: 4,
    batchId: 'four',
  });

  expect(() =>
    createEvents<'trapperCageProduction'>(db, {
      type: 'trapperCageProduction',
      villageId: village.id,
      amount: 1,
      batchId: 'overflow',
    }),
  ).toThrow('capacity exceeded');

  const scheduler = createSchedulerDataSource(db);
  const [first] = scheduler.getPastEventIds(NOW + 300_000);

  scheduler.resolveEvent(first);

  expect(() =>
    createEvents<'trapperCageProduction'>(db, {
      type: 'trapperCageProduction',
      villageId: village.id,
      amount: 1,
      batchId: 'still-full',
    }),
  ).toThrow('capacity exceeded');
});

test.each([0, -1, 1.5])('cage requests reject invalid amount %s', (amount) => {
  for (const type of types) {
    expect(
      createEventDtoSchema.safeParse({
        type,
        villageId: 1,
        batchId: 'invalid',
        amount,
      }).success,
    ).toBe(false);
  }
});
