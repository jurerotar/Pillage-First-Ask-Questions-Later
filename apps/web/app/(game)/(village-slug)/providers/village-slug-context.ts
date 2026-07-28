import { createContext } from 'react';

export type VillageSlugContextValue = {
  villageSlug: string;
};

export const VillageSlugContext = createContext<VillageSlugContextValue>(
  {} as never,
);
