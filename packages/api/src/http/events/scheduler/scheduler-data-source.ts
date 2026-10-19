import { z } from 'zod';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectNextEventQuery } from '../../../queries/event-queries';
import { postWorkerMessage } from '../../../worker/notification-port';
import { resolveEvent } from '../resolve-event';
import type { SchedulerDataSource } from './scheduler';

const getPastEventIdsSchema = z.number();
export const COMMIT_BATCH_SIZE = 64;

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
        sql: 'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at, id;',
        bind: { $now: now },
        schema: getPastEventIdsSchema,
      });
    },
    getNextEvent: (now: number) => {
      return (
        database.selectObject({
          sql: selectNextEventQuery,
          bind: { $now: now },
          schema: getNextEventSchema,
        }) ?? null
      );
    },
    resolveEvent: (id: GameEvent['id']) => {
      database.transaction((tx) => {
        resolveEvent(tx, id);
      });
    },
    resolveEvents: (ids: Iterable<GameEvent['id']>) => {
      const iterator = ids[Symbol.iterator]();
      let next = iterator.next();

      while (!next.done) {
        const notifications: EventApiNotificationEvent[] = [];
        let failure: { error: unknown } | undefined;

        database.transaction((tx) => {
          for (
            let count = 0;
            count < COMMIT_BATCH_SIZE && !next.done;
            count += 1
          ) {
            let notification: EventApiNotificationEvent | undefined;

            tx.exec({ sql: 'SAVEPOINT scheduler_event;' });

            try {
              resolveEvent(tx, next.value, (event) => {
                notification = event;
              });

              tx.exec({ sql: 'RELEASE scheduler_event;' });
            } catch (error) {
              tx.exec({ sql: 'ROLLBACK TO scheduler_event;' });
              tx.exec({ sql: 'RELEASE scheduler_event;' });

              failure = { error };

              if (notification?.eventKey === 'event:success') {
                notification = undefined;
              }
            }

            if (notification) {
              notifications.push(notification);
            }

            if (failure) {
              break;
            }

            // Advance lazily so cancellation/rescan checks happen after each event.
            next = iterator.next();
          }
        });

        // A failed COMMIT throws above and discards this chunk's notifications.
        for (const notification of notifications) {
          postWorkerMessage(notification);
        }

        if (failure) {
          throw failure.error;
        }
      }
    },
  };
};
