import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectNextEventQuery } from '../../../queries/event-queries';
import { resolveEvent } from '../resolve-event';
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
    getPastEventIds: (now: number) => {
      return database.selectValues({
        sql: 'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at;',
        bind: { $now: now },
        schema: getPastEventIdsSchema,
      });
    },
    getNextEvent: (now: number) => {
      return database.selectObject({
        sql: selectNextEventQuery,
        bind: { $now: now },
        schema: getNextEventSchema,
      })!;
    },
    resolveEvent: (id: GameEvent['id']) => {
      database.transaction((tx) => {
        resolveEvent(tx, id);
      });
    },
  };
};
