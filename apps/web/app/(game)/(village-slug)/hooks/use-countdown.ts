import { useSyncExternalStore } from 'react';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer.ts';

export const useCountdown = () => {
  return useSyncExternalStore(subscribeToTimer, getCurrentTime);
};
