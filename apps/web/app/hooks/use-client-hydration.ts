import { useSyncExternalStore } from 'react';

const subscribeToClientHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export const useClientHydration = () => {
  return useSyncExternalStore(
    subscribeToClientHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
};
