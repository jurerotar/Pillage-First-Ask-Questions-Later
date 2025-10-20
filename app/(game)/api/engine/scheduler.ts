import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import {
  markNeedsRescan,
  takeNeedsRescan,
} from 'app/(game)/api/engine/scheduler-signal';
import { resolveEvent } from 'app/(game)/api/engine/resolver';

let scheduledTimeout: number | null = null;
let schedulingInProgress = false;

export const scheduleNextEvent = (database: DbFacade) => {
  if (scheduledTimeout !== null) {
    self.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  // If another schedule run is in progress, request a rescan and return.
  if (schedulingInProgress) {
    markNeedsRescan();
    return;
  }

  schedulingInProgress = true;
  try {
    while (true) {
      // If someone requested a rescan before we started, consume-request and continue.
      takeNeedsRescan();

      const pastEventIds = database.selectValues(
        'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at;',
        { $now: Date.now() },
      ) as GameEvent['id'][];

      if (pastEventIds.length === 0) {
        break;
      }

      for (const id of pastEventIds) {
        // Clear any request before processing this id so new notifications can be detected.
        // If createEvents marks a request during the transaction, it will be observed below.
        // We don't need a local flag — use takeNeedsRescan() after processing.
        database.transaction((tx) => {
          resolveEvent(tx, id);
        });

        // If any createEvents during resolveEvent called markNeedsRescan(), take it now
        // and restart the outer loop (re-query) so new immediate events are handled.
        if (takeNeedsRescan()) {
          break;
        }
      }
    }

    const next = database.selectObject(
      `
        SELECT id, resolves_at as resolvesAt
        FROM events
        WHERE resolves_at > $now
        ORDER BY resolves_at
        LIMIT 1;
      `,
      { $now: Date.now() },
    ) as Pick<GameEvent, 'id' | 'resolvesAt'>;

    if (!next) {
      return;
    }

    const delay = Math.max(0, next.resolvesAt - Date.now());
    scheduledTimeout = self.setTimeout(() => {
      scheduledTimeout = null;
      resolveEvent(database, next.id);
      scheduleNextEvent(database);
    }, delay);
  } finally {
    schedulingInProgress = false;

    // If a request arrived while we were finishing, consume and restart.
    if (takeNeedsRescan()) {
      scheduleNextEvent(database);
    }
  }
};
