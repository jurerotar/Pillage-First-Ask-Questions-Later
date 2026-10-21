import { useMemo, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

export const useMediaQuery = (query: string): boolean => {
  const store = useMemo(() => {
    const mediaQuery = window.matchMedia(query);

    return {
      getSnapshot: () => mediaQuery.matches,
      subscribe: (callback: () => void) => {
        mediaQuery.addEventListener('change', callback);

        return () => {
          mediaQuery.removeEventListener('change', callback);
        };
      },
    };
  }, [query]);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
};
