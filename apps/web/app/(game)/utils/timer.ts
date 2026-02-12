let currentTime = Date.now();
const listeners = new Set<() => void>();

export const subscribeToTimer = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const getCurrentTime = () => {
  return currentTime;
};

setInterval(() => {
  currentTime = Date.now();
  for (const listener of listeners) {
    listener();
  }
}, 1000);
