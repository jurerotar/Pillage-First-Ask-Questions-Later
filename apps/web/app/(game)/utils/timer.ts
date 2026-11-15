let currentTime = Date.now();
const listeners = new Set<() => void>();

const refreshCurrentTime = () => {
  const nextTime = Date.now();
  if (nextTime === currentTime) {
    return false;
  }

  currentTime = nextTime;
  return true;
};

const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

const refreshAndNotify = () => {
  if (!refreshCurrentTime()) {
    return;
  }

  notifyListeners();
};

export const subscribeToTimer = (callback: () => void) => {
  const isFirstSubscriber = listeners.size === 0;
  listeners.add(callback);

  if (isFirstSubscriber && refreshCurrentTime()) {
    queueMicrotask(notifyListeners);
  }

  return () => {
    listeners.delete(callback);
  };
};

export const getCurrentTime = () => {
  return currentTime;
};

setInterval(refreshAndNotify, 1000);

globalThis.addEventListener?.('focus', refreshAndNotify);
globalThis.addEventListener?.('pageshow', refreshAndNotify);

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshAndNotify();
    }
  });
}
