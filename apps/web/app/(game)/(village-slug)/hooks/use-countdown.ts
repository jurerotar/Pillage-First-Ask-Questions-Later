import { useSyncExternalStore } from 'react';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';

export const useCountdown = () => {
  return useSyncExternalStore(subscribeToTimer, getCurrentTime);
};
