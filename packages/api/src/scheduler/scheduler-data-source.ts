import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { resolveEvent } from '../utils/resolver';
import type { SchedulerDataSource } from './scheduler';

export const createSchedulerDataSource = (
  database: DbFacade,
): SchedulerDataSource => {
  return {
    getPastEventIds: (now: number) => {
      return database.selectValues(
        'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at;',
        { $now: now },
      ) as GameEvent['id'][];
    },
    getNextEvent: (now: number) => {
      return database.selectObject(
        `
          SELECT id, resolves_at as resolvesAt
          FROM events
          WHERE resolves_at > $now
          ORDER BY resolves_at
          LIMIT 1;
        `,
        { $now: now },
      ) as Pick<GameEvent, 'id' | 'resolvesAt'> | null;
    },
    resolveEvent: (id: GameEvent['id']) => {
      database.transaction((tx) => {
        resolveEvent(tx, id);
      });
    },
  };
};
