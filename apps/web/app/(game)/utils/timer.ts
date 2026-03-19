let currentTime = Date.now();
let timeOffsetMs = 0;
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

export const syncCurrentTime = (gameTimeMs: number) => {
  timeOffsetMs = gameTimeMs - Date.now();
  currentTime = gameTimeMs;

  for (const listener of listeners) {
    listener();
  }
};

export const advanceCurrentTime = (durationMs: number) => {
  timeOffsetMs += durationMs;
  currentTime += durationMs;

  for (const listener of listeners) {
    listener();
  }
};

setInterval(() => {
  currentTime = Date.now() + timeOffsetMs;
  for (const listener of listeners) {
    listener();
  }
}, 1000);
