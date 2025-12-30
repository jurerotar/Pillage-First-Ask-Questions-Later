import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  markNeedsRescan,
  registerKickCallback,
  takeNeedsRescan,
} from './scheduler-signal';

export type SchedulerDataSource = {
  getPastEventIds(now: number): GameEvent['id'][];
  getNextEvent(now: number): Pick<GameEvent, 'id' | 'resolvesAt'> | null;
  resolveEvent(id: GameEvent['id']): void;
};

let scheduledTimeout: number | null = null;
let schedulingInProgress = false;
let shutdownController = new AbortController();

/** @internal only for testing */
export const resetSchedulerForTesting = () => {
  if (scheduledTimeout !== null) {
    globalThis.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
  schedulingInProgress = false;
  shutdownController = new AbortController();
};

export const cancelScheduling = () => {
  if (!shutdownController.signal.aborted) {
    shutdownController.abort();
  }

  if (scheduledTimeout !== null) {
    globalThis.clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
};

export const initScheduler = (dataSource: SchedulerDataSource) => {
  registerKickCallback(() => kickSchedulerNow(dataSource));
};

export const kickSchedulerNow = (dataSource: SchedulerDataSource) => {
  // Always mark so scheduleNextEvent loop knows something changed.
  markNeedsRescan();

  // If we've been cancelled already, nothing to do.
  if (shutdownController.signal.aborted) {
    return;
  }

  // If a timeout is currently scheduled, clear it so we don't wait for the old firing.
  if (scheduledTimeout !== null) {
    try {
      globalThis.clearTimeout(scheduledTimeout);
    } catch {
      // ignore (some runtimes might differ)
    }
    scheduledTimeout = null;
  }

  // Call scheduleNextEvent asynchronously to avoid reentrancy with the caller's DB transaction.
  // Using setTimeout 0 gives the runtime a tick to let a committed transaction flush.
  globalThis.setTimeout(() => {
    // Defensive: do nothing if shutdown happened meanwhile
    if (shutdownController.signal.aborted) {
      return;
    }
    // scheduleNextEvent has internal guards for schedulingInProgress
    scheduleNextEvent(dataSource);
  }, 0);
};

export const scheduleNextEvent = (dataSource: SchedulerDataSource) => {
  // If we've been canceled, bail out immediately.
  if (shutdownController.signal.aborted) {
    return;
  }

  if (scheduledTimeout !== null) {
    globalThis.clearTimeout(scheduledTimeout);
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

      const pastEventIds = dataSource.getPastEventIds(Date.now());

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
        dataSource.resolveEvent(id);

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

      dataSource.resolveEvent(next.id);
      scheduleNextEvent(dataSource);
    }, delay) as unknown as number;
  } finally {
    schedulingInProgress = false;

    // If a request arrived while we were finishing, consume and restart.
    if (!shutdownController.signal.aborted && takeNeedsRescan()) {
      scheduleNextEvent(dataSource);
    }
  }
};
