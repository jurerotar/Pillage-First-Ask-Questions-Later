import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { applyOfflineCap, getEffectiveNow } from '../utils/game-time';
import { resolveEvent } from '../utils/resolver';
import type { SchedulerDataSource } from './scheduler';

const getPastEventIdsSchema = z.number();

const getNextEventSchema = z.strictObject({
  id: z.number(),
  resolvesAt: z.number(),
});

export const createSchedulerDataSource = (
  database: DbFacade,
): SchedulerDataSource => {
  return {
    getPastEventIds: (_now: number) => {
      applyOfflineCap(database);
      const effectiveNow = getEffectiveNow(database);

      return database.selectValues({
        sql: 'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at;',
        bind: { $now: effectiveNow },
        schema: getPastEventIdsSchema,
      });
    },
    getNextEvent: (_now: number) => {
      applyOfflineCap(database);
      const effectiveNow = getEffectiveNow(database);
      const wallNow = Date.now();

      const nextEvent = database.selectObject({
        sql: `
          WITH current_meta AS (
            SELECT vacation_started_at AS vacationStartedAt
            FROM meta
            LIMIT 1
          )
          SELECT id, resolves_at as resolvesAt
          FROM events
          CROSS JOIN current_meta
          WHERE resolves_at > $now
            AND current_meta.vacationStartedAt IS NULL
          ORDER BY resolves_at
          LIMIT 1;
        `,
        bind: { $now: effectiveNow },
        schema: getNextEventSchema,
      });

      if (!nextEvent) {
        return null;
      }

      return {
        id: nextEvent.id,
        resolvesAt: wallNow + Math.max(0, nextEvent.resolvesAt - effectiveNow),
      };
    },
    resolveEvent: (id: GameEvent['id']) => {
      database.transaction((tx) => {
        resolveEvent(tx, id);
      });
    },
  };
};
