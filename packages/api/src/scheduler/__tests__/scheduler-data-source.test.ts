import { describe, expect, test, vi } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { createSchedulerDataSource } from '../scheduler-data-source';

describe('createSchedulerDataSource', () => {
  test('getPastEventIds uses effective game time when time was skipped', async () => {
    const database = await prepareTestDatabase();
    const dataSource = createSchedulerDataSource(database);

    vi.useFakeTimers();
    vi.setSystemTime(1_000);

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 1000,
          total_time_skipped = 1000,
          vacation_started_at = NULL;
      `,
    });

    database.exec({
      sql: "INSERT INTO events (id, type, starts_at, duration, village_id) VALUES (991001, 'unitResearch', 1400, 100, 1);",
    });

    expect(dataSource.getPastEventIds(Date.now())).toStrictEqual([991001]);
    vi.useRealTimers();
  });

  test('getNextEvent skips events already past in effective game time', async () => {
    const database = await prepareTestDatabase();
    const dataSource = createSchedulerDataSource(database);

    vi.useFakeTimers();
    vi.setSystemTime(1_000);

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 1000,
          total_time_skipped = 1_000,
          vacation_started_at = NULL;
      `,
    });

    database.exec({
      sql: "INSERT INTO events (id, type, starts_at, duration, village_id) VALUES (991011, 'unitResearch', 1400, 100, 1), (991012, 'unitResearch', 2_200, 100, 1);",
    });

    expect(dataSource.getNextEvent(Date.now())).toStrictEqual({
      id: 991012,
      resolvesAt: 2_300,
    });
    vi.useRealTimers();
  });
});
