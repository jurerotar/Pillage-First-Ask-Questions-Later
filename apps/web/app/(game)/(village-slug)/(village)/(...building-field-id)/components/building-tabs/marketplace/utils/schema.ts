import type { Resources as ResourcesType } from '@pillage-first/types/models/resource';

export type MarketplaceSendResourcesFormValues = {
  resources: ResourcesType;
  targetVillageId?: number;
};
