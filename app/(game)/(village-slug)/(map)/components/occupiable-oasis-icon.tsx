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

// Honestly, would be better to just type out every combination and skip the hardcoded assertions
const getIconType = (oasisResourceBonus: OasisResourceBonus[]): IconType => {
  // Resource combination
  if (oasisResourceBonus.length === 2) {
    const [firstBonus, secondBonus] = oasisResourceBonus;
    return `${firstBonus.resource}${capitalize(secondBonus.resource)}` as ResourceCombinationIconType;
  }

  // Single resource
  const [{ resource, bonus }] = oasisResourceBonus;
  return (
    bonus === '50%' ? `${resource}${capitalize(resource)}` : resource
  ) as ResourceCombinationIconType;
};

type OccupiableOasisIconProps = {
  oasisResourceBonus: OasisTile['ORB'];
};

export const OccupiableOasisIcon = (props: OccupiableOasisIconProps) => {
  const { oasisResourceBonus } = props;

  const iconType = getIconType(oasisResourceBonus);

  return (
    <Icon
      type={iconType}
      shouldShowTooltip={false}
    />
  );
};
