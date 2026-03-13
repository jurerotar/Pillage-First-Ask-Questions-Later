import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { applyOfflineCap, getEffectiveNow } from '../game-time';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

describe('game-time', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('getEffectiveNow caps offline progression to 24h', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(DAY_IN_MILLISECONDS * 3);

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 0,
          total_time_skipped = 0,
          vacation_started_at = NULL;
      `,
    });

    expect(getEffectiveNow(database)).toBe(DAY_IN_MILLISECONDS);
  });

  test('getEffectiveNow stays paused during vacation mode', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();
    vi.setSystemTime(DAY_IN_MILLISECONDS * 10);

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 1000,
          total_time_skipped = 500,
          vacation_started_at = 1200;
      `,
    });

    expect(getEffectiveNow(database)).toBe(1_500);
  });

  test('applyOfflineCap shifts only events beyond 24h progression cap', async () => {
    const database = await prepareTestDatabase();
    vi.useFakeTimers();

    const now = DAY_IN_MILLISECONDS + 5_000;
    vi.setSystemTime(now);

    database.exec({
      sql: `
        INSERT INTO events (id, type, starts_at, duration, village_id)
        VALUES
          (910001, 'unitResearch', $start_a, 500, 1),
          (910002, 'unitResearch', $start_b, 500, 1);
      `,
      bind: {
        $start_a: DAY_IN_MILLISECONDS - 1_000,
        $start_b: DAY_IN_MILLISECONDS + 1_000,
      },
    });

    database.exec({
      sql: `
        UPDATE meta
        SET
          last_write = 0,
          total_time_skipped = 0,
          vacation_started_at = NULL;
      `,
    });

    applyOfflineCap(database);

    const events = database.selectObjects({
      sql: 'SELECT id, starts_at AS startsAt FROM events WHERE id IN (910001, 910002) ORDER BY id;',
      schema: z.strictObject({
        id: z.number(),
        startsAt: z.number(),
      }),
    });

    const meta = database.selectObject({
      sql: 'SELECT last_write AS lastWrite FROM meta LIMIT 1;',
      schema: z.strictObject({
        lastWrite: z.number(),
      }),
    })!;

    expect(events).toStrictEqual([
      { id: 910001, startsAt: DAY_IN_MILLISECONDS - 1_000 },
      { id: 910002, startsAt: DAY_IN_MILLISECONDS + 6_000 },
    ]);
    expect(meta.lastWrite).toBe(now);
  });
});
