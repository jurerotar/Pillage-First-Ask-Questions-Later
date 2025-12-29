import { resolveEvent } from 'app/(game)/api/engine/resolver';
import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import type { SchedulerDataSource } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

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
