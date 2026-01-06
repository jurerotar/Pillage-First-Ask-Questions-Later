import { useSyncExternalStore } from 'react';

let currentTime = Date.now();
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const getSnapshot = () => {
  return currentTime;
};

setInterval(() => {
  currentTime = Date.now();
  for (const listener of listeners) {
    listener();
  }
}, 1000);

export const useCountdown = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
