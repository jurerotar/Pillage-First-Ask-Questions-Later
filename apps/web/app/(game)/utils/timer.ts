const listeners = new Set<() => void>();

export const subscribeToTimer = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const getCurrentTime = () => {
  return Date.now();
};

setInterval(() => {
  for (const listener of listeners) {
    listener();
  }
}, 1000);
