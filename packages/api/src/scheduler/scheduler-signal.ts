let needsRescanFlag = false;
let kickCallback: (() => void) | null = null;

// Call this when new events that should be processed immediately are inserted.
export const markNeedsRescan = (): void => {
  needsRescanFlag = true;
};

// Atomically consume the current rescan request flag.
// Returns true if a rescan was requested (and clears the flag).
export const takeNeedsRescan = (): boolean => {
  const v = needsRescanFlag;
  needsRescanFlag = false;
  return v;
};

export const registerKickCallback = (callback: () => void): void => {
  kickCallback = callback;
};

export const triggerKick = (): void => {
  markNeedsRescan();
  kickCallback?.();
};
