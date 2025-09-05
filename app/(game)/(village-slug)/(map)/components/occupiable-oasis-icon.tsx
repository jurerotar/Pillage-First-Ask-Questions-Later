import { Icon } from 'app/components/icon';
import type {
  IconType,
  ResourceCombinationIconType,
} from 'app/components/icons/icons';
import type {
  OasisResourceBonus,
  OasisTile,
} from 'app/interfaces/models/game/tile';
import { capitalize } from 'moderndash';
import type React from 'react';

type OccupiableOasisIconProps = {
  oasisResourceBonus: OasisTile['ORB'];
};

// Honestly, would be better to just type out every combination and skip the hardcoded assertions
const getIconType = (oasisResourceBonus: OasisResourceBonus[]): IconType => {
  // Resource combination
  if (oasisResourceBonus.length === 2) {
    const [firstBonus, secondBonus] = oasisResourceBonus;
    return `${firstBonus.resource}${capitalize(secondBonus.resource)}` as ResourceCombinationIconType;
  }

  // Single resource
  const { resource, bonus } = oasisResourceBonus[0];
  return (
    bonus === '50%' ? `${resource}${capitalize(resource)}` : resource
  ) as ResourceCombinationIconType;
};

export const OccupiableOasisIcon: React.FC<OccupiableOasisIconProps> = (
  props,
) => {
  const { oasisResourceBonus } = props;

  const iconType = getIconType(oasisResourceBonus);

  return (
    <Icon
      type={iconType}
      shouldShowTooltip={false}
    />
  );
};
