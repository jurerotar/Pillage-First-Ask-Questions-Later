import { useCallback, useSyncExternalStore } from 'react';

// Only notify at the boundaries instead of subscribing to the per-second timer.
export const useTimeWindow = (startsAt: number, endsAt: number) => {
  const subscribe = useCallback(
    (notify: () => void) => {
      const now = Date.now();
      const timers: ReturnType<typeof setTimeout>[] = [];

      for (const boundary of [startsAt, endsAt]) {
        if (boundary > now) {
          timers.push(setTimeout(notify, boundary - now));
        }
      }

      return () => {
        for (const timer of timers) {
          clearTimeout(timer);
        }
      };
    },
    [startsAt, endsAt],
  );

  const getSnapshot = useCallback(() => {
    const now = Date.now();
    return now >= startsAt && now < endsAt;
  }, [startsAt, endsAt]);

  return useSyncExternalStore(subscribe, getSnapshot);
};
