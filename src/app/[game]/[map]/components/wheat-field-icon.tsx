import { Icon, type IconProps } from 'app/components/icon';
import type { OccupiableTile } from 'interfaces/models/game/tile';
import type React from 'react';

type WheatFieldIconProps = Pick<OccupiableTile, 'resourceFieldComposition'> & Omit<IconProps, 'type'>;

export const WheatFieldIcon: React.FC<WheatFieldIconProps> = ({ resourceFieldComposition, ...rest }) => {
  return (
    <Icon
      {...rest}
      className="select-none h-3 w-3"
      type="wheat"
      borderVariant="yellow"
      wrapperClassName="absolute top-0 right-0"
    />
  );
};
