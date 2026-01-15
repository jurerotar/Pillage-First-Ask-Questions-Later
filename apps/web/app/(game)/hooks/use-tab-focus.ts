import { useSyncExternalStore } from 'react';

const subscribers = new Set<() => void>();

const handleFocus = () => {
  for (const cb of subscribers) {
    cb();
  }
};
const handleBlur = () => {
  for (const cb of subscribers) {
    cb();
  }
};
const handleVisibilityChange = () => {
  for (const cb of subscribers) {
    cb();
  }
};

let isListening = false;

const subscribe = (callback: () => void) => {
  subscribers.add(callback);

  if (!isListening) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    isListening = true;
  }

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && isListening) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      isListening = false;
    }
  };
};

const getSnapshot = () => {
  return !document.hidden && document.hasFocus();
};

export const useTabFocus = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
