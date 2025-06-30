import { useSyncExternalStore } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const getSnapshot = () => window.matchMedia(query).matches;

  return useSyncExternalStore(
    (cb) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', cb);
      return () => mediaQueryList.removeEventListener('change', cb);
    },
    getSnapshot,
    () => false,
  );
};
