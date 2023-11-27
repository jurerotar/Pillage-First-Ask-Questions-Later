import React from 'react';
import { FreeTile } from 'interfaces/models/game/tile';
import { Icon, IconProps } from 'components/icon';

type WheatFieldIconProps = Pick<FreeTile, 'resourceFieldComposition'> & Omit<IconProps, 'type'>;

export const WheatFieldIcon: React.FC<WheatFieldIconProps> = ({ resourceFieldComposition, ...rest }) => {
  return (
    <Icon
      {...rest}
      className="select-noneh-3 w-3"
      type="wheat"
      borderVariant="yellow"
    />
  );
};
