import type { DbFacade } from 'app/(game)/api/facades/database-facade';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import {
  markNeedsRescan,
  takeNeedsRescan,
} from 'app/(game)/api/engine/scheduler-signal';
import { resolveEvent } from 'app/(game)/api/engine/resolver';

let scheduledTimeout: number | null = null;
let schedulingInProgress = false;
const shutdownController = new AbortController();

export const cancelScheduling = () => {
  if (!shutdownController.signal.aborted) {
    shutdownController.abort();
  }

  if (scheduledTimeout !== null) {
    self.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
};

export const kickSchedulerNow = (database: DbFacade) => {
  // Always mark so scheduleNextEvent loop knows something changed.
  markNeedsRescan();

  // If we've been cancelled already, nothing to do.
  if (shutdownController.signal.aborted) {
    return;
  }

  // If a timeout is currently scheduled, clear it so we don't wait for the old firing.
  if (scheduledTimeout !== null) {
    try {
      self.clearTimeout(scheduledTimeout);
    } catch {
      // ignore (some runtimes might differ)
    }
    scheduledTimeout = null;
  }

  // Call scheduleNextEvent asynchronously to avoid reentrancy with the caller's DB transaction.
  // Using setTimeout 0 gives the runtime a tick to let a committed transaction flush.
  self.setTimeout(() => {
    // Defensive: do nothing if shutdown happened meanwhile
    if (shutdownController.signal.aborted) {
      return;
    }
    // scheduleNextEvent has internal guards for schedulingInProgress
    scheduleNextEvent(database);
  }, 0);
};

export const scheduleNextEvent = (database: DbFacade) => {
  // If we've been canceled, bail out immediately.
  if (shutdownController.signal.aborted) {
    return;
  }

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
      // If cancellation happened while we were looping, stop.
      if (shutdownController.signal.aborted) {
        break;
      }

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
        // Respect cancel signal between each event processing.
        if (shutdownController.signal.aborted) {
          break;
        }

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

    if (shutdownController.signal.aborted) {
      return;
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
      // Timeout fired — clear reference first
      scheduledTimeout = null;

      // Do nothing if we've been canceled in the meantime.
      if (shutdownController.signal.aborted) {
        return;
      }

      resolveEvent(database, next.id);
      scheduleNextEvent(database);
    }, delay);
  } finally {
    schedulingInProgress = false;

    // If a request arrived while we were finishing, consume and restart.
    if (!shutdownController.signal.aborted && takeNeedsRescan()) {
      scheduleNextEvent(database);
    }
  }
};
