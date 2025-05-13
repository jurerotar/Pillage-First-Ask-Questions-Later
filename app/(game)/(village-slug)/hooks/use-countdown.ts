import { useSyncExternalStore } from 'react';

let currentTime = Date.now();
const listeners = new Set<() => void>();

let interval: ReturnType<typeof setInterval> | null = null;
let refCount = 0;

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  refCount++;

  if (refCount === 1) {
    interval = setInterval(() => {
      currentTime = Date.now();
      for (const listener of listeners) {
        listener();
      }
    }, 1000);
  }

  return () => {
    listeners.delete(callback);
    refCount--;

    if (refCount === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
};

const getSnapshot = () => currentTime;

export const useCountdown = () => useSyncExternalStore(subscribe, getSnapshot);
