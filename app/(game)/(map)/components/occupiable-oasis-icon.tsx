import { Icon, type IconProps } from 'app/components/icon';
import type { ResourceCombinationIconType } from 'app/components/icons/icon-maps';
import type { OasisResourceBonus, OasisTile } from 'app/interfaces/models/game/tile';
import { capitalize } from 'moderndash';
import type React from 'react';

type OccupiableOasisIconProps = Pick<OasisTile, 'oasisResourceBonus'> & Omit<IconProps, 'type'>;

// Honestly, would be better to just type out every combination and skip the hardcoded assertions
const getIconType = (oasisResourceBonus: OasisResourceBonus[]): IconProps['type'] => {
  // Resource combination
  if (oasisResourceBonus.length === 2) {
    const [firstBonus, secondBonus] = oasisResourceBonus;
    return `${firstBonus.resource}${capitalize(secondBonus.resource)}` as ResourceCombinationIconType;
  }

  // Single resource
  const { resource, bonus } = oasisResourceBonus[0];
  return (bonus === '50%' ? `${resource}${capitalize(resource)}` : resource) as ResourceCombinationIconType;
};

export const OccupiableOasisIcon: React.FC<OccupiableOasisIconProps> = (props) => {
  const { oasisResourceBonus, ...rest } = props;

  const iconType = getIconType(oasisResourceBonus);

  return (
    <Icon
      {...rest}
      className="select-none size-3"
      wrapperClassName="absolute top-0 right-0 z-10"
      type={iconType}
      asCss
    />
  );
};
