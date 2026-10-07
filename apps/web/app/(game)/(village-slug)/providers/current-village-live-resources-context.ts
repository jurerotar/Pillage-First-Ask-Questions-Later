import { createContext } from 'react';
import type { Resources } from '@pillage-first/types/models/resource';

export type CurrentVillageLiveResourcesSnapshot = Resources;

export type CurrentVillageLiveResourcesStore = {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => Resources;
};

export const CurrentVillageLiveResourcesSnapshotContext =
  createContext<CurrentVillageLiveResourcesSnapshot>({} as never);

export const CurrentVillageLiveResourcesStoreContext =
  createContext<CurrentVillageLiveResourcesStore | null>(null);
