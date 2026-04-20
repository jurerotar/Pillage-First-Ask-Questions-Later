import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const metaSchema = z.strictObject({
  lastWrite: z.number(),
  totalTimeSkipped: z.number(),
  vacationStartedAt: z.number().nullable(),
});

const getMeta = (database: DbFacade) => {
  return database.selectObject({
    sql: `
      SELECT
        last_write AS lastWrite,
        total_time_skipped AS totalTimeSkipped,
        vacation_started_at AS vacationStartedAt
      FROM
        meta;
    `,
    schema: metaSchema,
  })!;
};

export const getEffectiveNow = (database: DbFacade): number => {
  const now = Date.now();
  const meta = getMeta(database);

  if (meta.vacationStartedAt !== null) {
    return meta.lastWrite + meta.totalTimeSkipped;
  }

  const elapsed = Math.max(0, now - meta.lastWrite);

  return meta.lastWrite + meta.totalTimeSkipped + Math.min(elapsed, DAY_IN_MS);
};

export const applyOfflineCap = (database: DbFacade): void => {
  const now = Date.now();
  const meta = getMeta(database);

  if (meta.vacationStartedAt !== null) {
    return;
  }

  const elapsed = now - meta.lastWrite;

  if (elapsed <= DAY_IN_MS) {
    return;
  }

  const overflow = elapsed - DAY_IN_MS;
  const progressionCap = meta.lastWrite + meta.totalTimeSkipped + DAY_IN_MS;

  database.transaction((db) => {
    db.exec({
      sql: `
        UPDATE events
        SET
          starts_at = starts_at + $overflow
        WHERE
          resolves_at > $progression_cap;
      `,
      bind: {
        $overflow: overflow,
        $progression_cap: progressionCap,
      },
    });

    db.exec({
      sql: `
        UPDATE meta
        SET
          last_write = $now;
      `,
      bind: {
        $now: now,
      },
    });
  });
};
