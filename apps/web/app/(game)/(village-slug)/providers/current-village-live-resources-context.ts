import { createContext } from 'react';
import type { Resources } from '@pillage-first/types/models/resource';

export type CurrentVillageLiveResourcesContextReturn = Resources;

export const CurrentVillageLiveResourcesContext =
  createContext<CurrentVillageLiveResourcesContextReturn>({} as never);
