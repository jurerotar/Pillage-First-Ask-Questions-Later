import { camelCase } from 'moderndash';
import type { Resource } from '@pillage-first/types/models/resource';
import type { OasisBonusType } from '@pillage-first/types/models/tile';
import type { ResourceCombinationIconType } from 'app/components/icons/icons';

export const getOasisBonusIconType = (
  resource: Resource,
  bonusType: OasisBonusType,
): Resource | ResourceCombinationIconType => {
  if (bonusType === null || bonusType === 1) {
    return resource;
  }

  if (bonusType === 2) {
    return `${resource}Wheat`;
  }

  return camelCase(`${resource} ${resource}`) as ResourceCombinationIconType;
};

export const getOasisBonusLabel = (bonusType: OasisBonusType): string => {
  if (bonusType === 2) {
    return '25% + 25%';
  }

  if (bonusType === 3) {
    return '50%';
  }

  return '25%';
};
