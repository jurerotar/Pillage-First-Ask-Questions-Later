import { createContext } from 'react';
import type { Preferences } from '@pillage-first/types/models/preferences';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Village } from '@pillage-first/types/models/village';

type VillageMapContextValue = {
  bookmarks: Record<string, string>;
  currentVillage: Village;
  isWiderThanLg: boolean;
  resourceFieldComposition: ResourceFieldComposition;
  shouldShowBuildingNames: Preferences['shouldShowBuildingNames'];
};

export const VillageMapContext = createContext<VillageMapContextValue>(
  {} as VillageMapContextValue,
);
