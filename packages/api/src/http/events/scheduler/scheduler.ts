import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  clearKickCallback,
  markNeedsRescan,
  registerKickCallback,
  resetSchedulerSignalForTesting,
  takeNeedsRescan,
} from './scheduler-signal';

export type SchedulerDataSource = {
  getPastEventIds(now: number): GameEvent['id'][];
  getNextEvent(now: number): Pick<GameEvent, 'id' | 'resolvesAt'> | null;
  resolveEvent(id: GameEvent['id']): void;
  resolveEvents(ids: Iterable<GameEvent['id']>): void;
};

let scheduledTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
let pendingKickTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
let schedulingInProgress = false;
let shutdownController = new AbortController();

const clearScheduledTimeout = (): void => {
  if (scheduledTimeout !== null) {
    globalThis.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
};

const clearPendingKickTimeout = (): void => {
  if (pendingKickTimeout !== null) {
    globalThis.clearTimeout(pendingKickTimeout);
    pendingKickTimeout = null;
  }
};

/** @internal only for testing */
export const resetSchedulerForTesting = (): void => {
  clearScheduledTimeout();
  clearPendingKickTimeout();
  schedulingInProgress = false;
  shutdownController = new AbortController();
  resetSchedulerSignalForTesting();
};

export const cancelScheduling = (): void => {
  if (!shutdownController.signal.aborted) {
    shutdownController.abort();
  }

  clearScheduledTimeout();
  clearPendingKickTimeout();
  clearKickCallback();
};

export const scheduleNextEvent = (dataSource: SchedulerDataSource): void => {
  // If we've been canceled, bail out immediately.
  if (shutdownController.signal.aborted) {
    return;
  }

  clearScheduledTimeout();
  clearPendingKickTimeout();

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

      const pastEventIds = dataSource.getPastEventIds(Date.now());

      if (pastEventIds.length === 0) {
        break;
      }

      function* pendingEventIds(): Generator<GameEvent['id']> {
        for (const id of pastEventIds) {
          if (shutdownController.signal.aborted) {
            break;
          }

          yield id;

          if (takeNeedsRescan()) {
            break;
          }
        }
      }

      dataSource.resolveEvents(pendingEventIds());
    }

    if (shutdownController.signal.aborted) {
      return;
    }

    const next = dataSource.getNextEvent(Date.now());

    if (!next) {
      return;
    }

    const delay = Math.max(0, next.resolvesAt - Date.now());
    scheduledTimeout = globalThis.setTimeout(() => {
      // Timeout fired — clear reference first
      scheduledTimeout = null;

      // Do nothing if we've been canceled in the meantime.
      if (shutdownController.signal.aborted) {
        return;
      }

      try {
        dataSource.resolveEvent(next.id);
      } catch (error) {
        console.error(error);
      }

      scheduleNextEvent(dataSource);
    }, delay);
  } finally {
    schedulingInProgress = false;

    // If a request arrived while we were finishing, consume and restart.
    if (!shutdownController.signal.aborted && takeNeedsRescan()) {
      scheduleNextEvent(dataSource);
    }
  }
};

export const kickSchedulerNow = (dataSource: SchedulerDataSource): void => {
  // Always mark so scheduleNextEvent loop knows something changed.
  markNeedsRescan();

  // If we've been canceled already, nothing to do.
  if (shutdownController.signal.aborted) {
    return;
  }

  // If a timeout is currently scheduled, clear it so we don't wait for the old firing.
  clearScheduledTimeout();

  if (pendingKickTimeout !== null) {
    return;
  }

  // Call scheduleNextEvent asynchronously to avoid reentrancy with the caller's DB transaction.
  // Using setTimeout 0 gives the runtime a tick to let a committed transaction flush.
  pendingKickTimeout = globalThis.setTimeout(() => {
    pendingKickTimeout = null;

    // Defensive: do nothing if shutdown happened meanwhile
    if (shutdownController.signal.aborted) {
      return;
    }
    // scheduleNextEvent has internal guards for schedulingInProgress
    scheduleNextEvent(dataSource);
  }, 0);
};

export const initScheduler = (dataSource: SchedulerDataSource): void => {
  registerKickCallback(() => kickSchedulerNow(dataSource));
};
