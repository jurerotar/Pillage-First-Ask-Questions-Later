import type { Resources as ResourcesType } from '@pillage-first/types/models/resource';

export type MarketplaceSendResourcesFormValues = {
  repeatCount: number;
  resources: ResourcesType;
  targetVillageId?: number;
};
